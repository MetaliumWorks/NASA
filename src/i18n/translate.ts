// Turkish for the screen, applied to what React renders. The dictionary is keyed by the English text with
// every number replaced by {n}; a Turkish value puts the numbers back with {n} (in order) or {0}, {1}… (by place).
// Anything not in the dictionary stays in English, so a missing entry never breaks a screen.
import TR from './tr.json';

const DICT = TR as Record<string, string>;
const NUM = /\d+(?:[.,]\d+)?/g;
const ATTRS = ['aria-label', 'title', 'placeholder'];
const LANG_KEY = 'crew-health/lang';

export type Lang = 'en' | 'tr';

export function getLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

/** Switch language. The page reloads so every screen is drawn fresh in it. */
export function setLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* storage blocked: stays in the current language */
  }
  location.reload();
}

const tx = (s: string) => translateText(s) ?? s;
const side = (w: string) => (w === 'above' ? 'üstünde' : 'altında');

/** Text the app builds from parts: each rule translates the parts it captures. */
const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Critical reading: (.+)$/, (m) => `Kritik değer: ${tx(m[1])}`],
  [
    /^Today (.+?) · Critical reading (.+?), (.+?) (above|below) baseline$/,
    (m) => `Bugün ${tx(m[1])} · Kritik değer ${tx(m[2])}, başlangıcın ${m[3]} ${side(m[4])}`,
  ],
  [/^Critical reading (.+?), (.+?) (above|below) baseline$/, (m) => `Kritik değer ${tx(m[1])}, başlangıcın ${m[2]} ${side(m[3])}`],
  [/^Today (.+?) · (.+)$/, (m) => `Bugün ${tx(m[1])} · ${tx(m[2])}`],
  [/^(.+?) (above|below) baseline$/, (m) => `başlangıcın ${m[1]} ${side(m[2])}`],
  [/^(.+?): (.+)$/, (m) => `${tx(m[1])}: ${tx(m[2])}`],
];

function fromRules(core: string): string | null {
  for (const [rx, make] of RULES) {
    const m = core.match(rx);
    if (!m) continue;
    const out = make(m);
    if (out !== core) return out;
  }
  return null;
}

/** The Turkish for one piece of screen text, or null when there is none. */
export function translateText(text: string): string | null {
  const core = text.trim();
  if (!core) return null;
  const nums = core.match(NUM) ?? [];
  const value = DICT[core] ?? DICT[core.replace(NUM, '{n}')];
  if (value == null) {
    const ruled = fromRules(core);
    if (ruled == null) return null;
    return text.slice(0, text.indexOf(core)) + ruled + text.slice(text.indexOf(core) + core.length);
  }
  let next = 0;
  const filled = value.replace(/\{(n|\d)\}/g, (_, k: string) => (k === 'n' ? nums[next++] : nums[Number(k)]) ?? '');
  const lead = text.slice(0, text.indexOf(core));
  const tail = text.slice(text.indexOf(core) + core.length);
  return lead + filled + tail;
}

const skip = (el: Element | null) => !!el?.closest('input, textarea, [data-no-translate]');

function translateNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (skip(node.parentElement)) return;
    const tr = translateText(node.nodeValue ?? '');
    if (tr != null && tr !== node.nodeValue) node.nodeValue = tr;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) {
      const tr = translateText(v);
      if (tr != null && tr !== v) el.setAttribute(a, tr);
    }
  }
}

/** Translate every text and label under root, once. */
export function translateTree(root: Node) {
  translateNode(root);
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  while (walk.nextNode()) translateNode(walk.currentNode);
}

/** Keep root in Turkish as React draws and redraws it. */
export function keepTranslated(root: Node) {
  translateTree(root);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') translateNode(r.target);
      else if (r.type === 'attributes') translateNode(r.target);
      else r.addedNodes.forEach((n) => translateTree(n));
    }
  }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
