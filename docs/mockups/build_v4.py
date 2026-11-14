"""Build the figure mockup from the two public-domain drawings.

usage: python -I build_v4.py <skeleton.svg> <organs.svg> <template.html> <out.html>

- skeleton: the right arm (drawn palm-backward, bones crossed) is replaced by a mirror
  of the left arm, so both arms are in the same position.
- organs: selected embedded images are pulled out and placed in the skeleton's
  coordinate space.
"""
import copy
import sys
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
DROP_NS = ("http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd",
           "http://www.inkscape.org/namespaces/inkscape",
           "http://www.w3.org/XML/1998/namespace")
ET.register_namespace("", SVG)
ET.register_namespace("xlink", XLINK)

skel_src, organ_src, tpl, out = sys.argv[1:5]

# ---------------------------------------------------------------- skeleton
root = ET.parse(skel_src).getroot()


def clean(el):
    for k in list(el.attrib):
        if k.startswith("{") and k[1:].split("}")[0] in DROP_NS:
            del el.attrib[k]
    for child in el:
        clean(child)


grads = [el for el in root.iter() if el.tag in ("{%s}linearGradient" % SVG, "{%s}radialGradient" % SVG)]
layer = next(el for el in root.iter() if el.get("id") == "layer3")
for el in grads + [layer]:
    clean(el)

by_id = {el.get("id"): el for el in layer}
REMOVE = ["HumerusRight", "UlnaRight", "RadiusRight", "HandRight", "g1753"]
MIRROR = ["HumerusLeft", "RadiusLeft", "UlnaLeft", "HandLeft", "path1679", "path1681", "path1683"]
missing = [i for i in REMOVE + MIRROR if i not in by_id]
if missing:
    sys.exit("skeleton ids not found: " + ", ".join(missing))
for i in REMOVE:
    layer.remove(by_id[i])
arm = ET.SubElement(layer, "{%s}g" % SVG, {"id": "ArmRightMirrored", "transform": "translate(406 0) scale(-1 1)"})
for i in MIRROR:
    c = copy.deepcopy(by_id[i])
    for el in c.iter():
        if el.get("id"):
            el.set("id", el.get("id") + "-m")
    arm.append(c)


def ser(el):
    s = ET.tostring(el, encoding="unicode")
    return s.replace(' xmlns="%s"' % SVG, "").replace(' xmlns:xlink="%s"' % XLINK, "")


# ---------------------------------------------------------------- organs
oroot = ET.parse(organ_src).getroot()
images = {el.get("id"): el for el in oroot.iter("{%s}image" % SVG)}
# id in the source file -> (system name, x, y, width, height) in skeleton coordinates
PLACE = [
    ("image2204-9", "Brain, mind & sleep", 170, 24, 66, 58),
    ("image7849", "Lungs & oxygen", 144, 143, 119, 107),
    ("image3855", "Heart & vessels", 177, 142, 59, 94),
    ("image10296", "Digestion & nutrition", 147.5, 235, 100, 70.5),
    ("image3706", "Digestion & nutrition", 167, 233, 100, 83),
    ("image2224-4", "Digestion & nutrition", 140, 290, 126, 114),
]
KIDNEYS = ("image6280", "Kidneys", 150.6, 265.5, 108.4, 155)


def img(spec, cls):
    iid, name, x, y, w, h = spec
    if iid not in images:
        sys.exit("organ image not found: " + iid)
    href = images[iid].get("{%s}href" % XLINK) or images[iid].get("href")
    name = name.replace("&", "&amp;")
    return '<image class="%s" data-sys="%s" x="%s" y="%s" width="%s" height="%s" href="%s"/>' % (cls, name, x, y, w, h, href)


organs = "\n".join(img(s, "organ") for s in PLACE)
kidneys = img(KIDNEYS, "organ warn")

html = open(tpl, encoding="utf-8").read()
parts = {"<!--SKELETON_DEFS-->": "".join(ser(g) for g in grads), "<!--SKELETON-->": ser(layer),
         "<!--ORGANS-->": organs, "<!--KIDNEYS-->": kidneys}
for marker, value in parts.items():
    if html.count(marker) != 1:
        sys.exit("template marker missing or repeated: " + marker)
    html = html.replace(marker, value)
open(out, "w", encoding="utf-8").write(html)
print("page KB", len(html) // 1024)
