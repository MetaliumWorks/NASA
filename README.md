# Crew Health

A health monitor for astronauts on long missions, built for the NASA Space Apps Challenge 2026 (Bursa) challenge
"Create Health Monitoring Software for Astronauts on Space Missions".

On a long mission the astronaut has to notice changes in their own health. Crew Health does three things:

1. **Collects.** A short daily check-in and a weekly one record the health indicators.
2. **Assesses.** A scan-style body map shows at a glance which of 12 body systems asks for attention. The problem is
   lit where it is: the organ or the bones take the status colour.
3. **Guides.** Each system says what space does to it, what to do about it today and what to pass on to the ground
   team, with the NASA or CSA page each statement comes from.

It works the way a careful clinician would. The daily check-in is mandatory. A reading far from baseline has to be
measured again or confirmed. When findings match a condition the source pages describe, the app names it as
"Possible", and what is urgent is reported to the ground on its own.

It runs in the browser with no server, no account and no network connection.

## Run it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

`npm run build` writes a static site to `dist/`. It can be put on any static host, in a sub-folder too
(`base: './'`). `npm run preview` serves that build locally.

### As a Windows program

```bash
npm run app        # build, then open it in its own window
npm run dist:win   # build both Windows files into release/
```

`npm run dist:win` writes two files to `release/` (not committed):

- `CrewHealth-Setup-<version>.exe`: installs for the current user without admin rights, adds a desktop
  shortcut, and starts in about a second. Use this on the presentation computer.
- `CrewHealth-<version>.exe`: one file, no installation; it unpacks itself on every start, which takes
  15 to 25 seconds.

The window is [Electron](https://www.electronjs.org/) around the same `dist/` build (`electron/main.cjs`). It
needs no network. Links to NASA and CSA pages open in the system browser. The menu bar is hidden; for
presenting: **F11** full screen (**Esc** leaves it), **Ctrl +** / **Ctrl -** / **Ctrl 0** zoom, **Ctrl R** reload.
Saved data lives in the user's app data folder and survives closing the program.

## What is in it

| Screen | What it does |
|---|---|
| Body map | The figure, 12 systems and the radiation ring. The selected system reads like a short report: Findings with charts, Impression, Recommendation. With nothing selected it shows today: what is flagged, what is due, today's plan. |
| Check-in | Daily and mandatory, in five steps: vitals, sleep and mood, symptoms, nutrition and exercise, radiation. Until it is done the other screens are locked. It ends by saying what it found. Weekly: a reaction test, a vision test, height and a strength self-rating. |
| Symptom check | Any time. Say what you notice; the app asks about the other signs of the conditions it may be and for the measurements that help tell, then says what it finds. |
| Review | The last week or month, system by system: days each symptom was reported, days spent flagged, averages against the period before and the baseline. |
| Symptom log | Every symptom day by day, 30 days at a time, and the free-text discomforts. |
| Ground link | The log of what the app reported to the ground, and the full report to copy or download. The link is simulated: nothing leaves the device. |
| Mission | Station, Moon or Mars, and starting a real profile with its own baseline. |
| Sources | Every source page, the artwork credit, all limits, and what is simulated. |

The six indicators named by the challenge (blood pressure, heart rate, blood sugar, body temperature, sleep hours
and mood) are all recorded in the daily check-in.

## The demo is simulated

The app opens on **Crew 03**, a simulated crew member on flight day 47 of a 180-day station mission. The history is
generated from a fixed seed, so it is the same on every load: exercise is behind (Bones: caution), water intake is
low (Kidneys: warning) and trouble sleeping was reported on 3 of the last 7 days (Brain, mind & sleep: caution).
A "Simulated data" tag is on every screen while this profile is open.

Today's check-in is already done in the demo, so it opens on the body map, and its ground log holds what those 47
days would have reported. **Advance one day** starts a new day, which locks the app on the mandatory check-in;
"Fill with simulated readings" (simulated profile only) fills a step so a demo does not have to type every number.

The mission day does not follow the clock. **Advance one day** moves it on, so the demo looks the same whenever it
is shown. What you enter is added to the demo and saved in the browser; **Reset demo** (Sources or Mission screen)
restores the starting state.

## Possible conditions, critical readings and the ground link

- **Possible conditions.** `src/content/conditions.ts` holds the conditions the source pages describe (mild hypoxia,
  decompression sickness, space motion sickness, an altered immune response, low blood pressure and others), each
  with its signs and a passage from its page. Findings that match are shown as "Possible: ...". It is a match with
  the sources, not a diagnosis, and the app names nothing the pages do not describe.
- **Critical readings.** A single reading twice as far from baseline as its warning limit is critical. The check-in
  asks to measure again or confirm; a confirmed reading is reported at once. The factor is one number in
  `src/content/thresholds.ts` and, like every limit, the team's own setting.
- **Ground link.** The app reports a confirmed critical reading, every system at warning when a check ends, the
  weekly or monthly review when it finds something that keeps coming back, and a day left without its check-in.
  The link is simulated: messages are written to a log in the app and nothing leaves the device.

## Where the health content comes from

Health content comes only from the five pages of the challenge's Resources tab and the NASA and CSA pages they link
to directly. The text of those 51 pages is saved in `docs/sources/`.

- Every health statement in `src/content/` carries the id of its source page and a passage that appears word for
  word in the saved page. `src/content/content.test.ts` fails if a statement has no source or its passage is not in
  the page.
- The app links each statement to its page.
- The app does not diagnose. It shows which system asks for attention, names the conditions from the sources that
  the findings match, and passes on what the source recommends.

## The limits are the team's own

The source pages give no normal ranges and no alert thresholds for vital signs. **Every limit in this app is the
team's own setting, not a NASA value.** They live in one file, `src/content/thresholds.ts`, and the Sources screen
lists them and says so. Every comparison is with the crew member's own pre-flight baseline, and a missing entry
never flags a system.

Two numbers do come from the sources: the exercise target of 1.5 hours per day and the expected bone loss of 1% to
1.5% per month, which is shown as an expectation and not as a measurement. The sources give no limit for radiation,
so the dose is recorded and totalled only.

The reaction test and the vision test are not clinical tests. They compare a person with their own baseline on the
same screen, and say so.

## Artwork

Skeleton drawing by Mariana Ruiz Villarreal; unlabelled edition and organ drawings by Mikael Häggström. Public
domain, via Wikimedia Commons. The original files are in `assets-source/`.

`npm run prepare-figure` rebuilds the figure artwork from them (`scripts/prepare-figure.mjs`): the right arm becomes
a mirror of the left, editor metadata is removed, and the embedded organ images are written out as files. Its output
in `src/figure/generated/` is committed, so the app builds without running the script. The drawings are used for the
figure only, never as a source of health information.

## Use of Super Intelligence (SI)

This project was built with SI assistance: Claude (Anthropic) wrote most of the code and tests, drafted the texts,
made the 30-second demo video and drew the app icon (`build/icon.svg`), and helped gather the source pages. The team chose the idea and the
features, tested the app and asked for every change. The app itself uses no SI or machine learning: its findings come
from fixed rules, and every health statement is a quote from the NASA and CSA pages, checked by a test. The figure
artwork is public-domain drawings by people (see Artwork), not SI-generated.

## How it is built

React, TypeScript and Vite; tests with Vitest and React Testing Library. Charts are hand-written SVG. Fonts
(Instrument Sans, Martian Mono) and all artwork are bundled, so nothing is loaded from the network at run time.

```
src/content   the sourced data: regions, indicators, symptoms, sources, thresholds, missions
src/domain    pure functions: daily status, long-term checks, demo profile, review, report, input
src/state     one reducer, saved to localStorage
src/figure    the body figure and its prepared artwork
src/ui        the screens
```

- Status is never told by colour alone: nominal is a ring, caution a triangle, warning a square, each with its word.
- Everything can be reached by keyboard; text contrast is at least 4.5:1 (checked by `src/styles/styles.test.ts`).
- With "reduce motion" set in the system, all animation and transitions are off.
- The target is a laptop or projector, 1280 px and wider. Narrower screens stack the layout and do not scroll
  sideways.
- Saved data that is missing, damaged or of an older shape falls back to the demo instead of a blank screen.

Design and plan: `docs/superpowers/specs/2026-11-14-astronaut-health-monitor-design.md` and
`docs/superpowers/plans/2026-11-14-astronaut-health-monitor.md`. Approved mockup: `docs/mockups/lightbox-v4.html`.

## License

Copyright 2026 İkiAdam (Anıl Akyüz, İsmail Metehan Şahin). The team's own code and text are licensed under the
[Apache License 2.0](LICENSE). Third-party material keeps its own terms:

| Material | License |
|---|---|
| Skeleton and organ drawings (Mariana Ruiz Villarreal, Mikael Häggström, Wikimedia Commons) | Public domain |
| Instrument Sans and Martian Mono fonts (via Fontsource) | SIL Open Font License 1.1 |
| React, React DOM | MIT |
| Electron (Windows program only) | MIT |
| Development tools (Vite, TypeScript, Vitest, Testing Library, jsdom, electron-builder, @xmldom/xmldom) | MIT or Apache 2.0; not shipped in the app |
| Passages quoted from NASA and CSA pages | Their publishers' terms; each is shown with its source link |

See also [NOTICE](NOTICE).

## Türkçe özet

Crew Health, uzun görevlerdeki astronotlar için sunucusuz bir sağlık izleme uygulamasıdır. Astronot kısa bir günlük
ve haftalık kayıtla göstergelerini girer; tarama görünümlü vücut haritası 12 sistemden hangisinin ilgi istediğini
gösterir; her sistem için NASA/CSA kaynaklı açıklama ve öneriler sunulur. Arayüz İngilizcedir.

- Günlük kayıt **zorunludur**; bitene kadar diğer ekranlar kilitlidir. Temel değerden çok uzak bir okuma için
  uygulama "yeniden ölç ya da onayla" der.
- Bulgular kaynaklarda tarif edilen bir durumla eşleşirse "Possible: …" diye söylenir; **teşhis değildir**.
- Acil olan üsse kendiliğinden bildirilir. Bu bağlantı **simülasyondur**: mesajlar uygulamadaki kutuya yazılır.

- Açılıştaki "Crew 03" profili **simülasyondur**; her ekranda "Simulated data" etiketi görünür.
- Sağlık içeriği yalnızca `docs/sources/` içindeki 51 NASA/CSA sayfasından gelir; her metnin kaynağı ve sayfada
  birebir geçen alıntısı testle denetlenir.
- **Bütün eşikler ekibin kendi ayarıdır, NASA değeri değildir** (`src/content/thresholds.ts`).
- Çizimler Wikimedia Commons'taki kamu malı çizimlerdir (Mariana Ruiz Villarreal, Mikael Häggström).
- Proje yapay zekâ (SI) yardımıyla yapıldı: kodun ve testlerin çoğunu, metinleri, 30 saniyelik tanıtım videosunu ve uygulama simgesini
  Claude (Anthropic) hazırladı. Uygulamanın kendisi yapay zekâ kullanmaz.
- Çalıştırmak için: `npm install`, ardından `npm run dev`. Test: `npm test`. Derleme: `npm run build`.
- Lisans: Apache 2.0 (`LICENSE`). Çizimler kamu malı, fontlar SIL OFL 1.1, React ve Electron MIT.
