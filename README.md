# Crew Health

A health monitor for astronauts on long missions, built for the NASA Space Apps Challenge 2026 (Bursa) challenge
"Create Health Monitoring Software for Astronauts on Space Missions".

On a long mission the astronaut has to notice changes in their own health. Crew Health does three things:

1. **Collects.** A short daily check-in and a weekly one record the health indicators.
2. **Assesses.** A scan-style body map shows at a glance which of 12 body systems asks for attention. The problem is
   lit where it is: the organ or the bones take the status colour.
3. **Guides.** Each system says what space does to it, what to do about it today and what to pass on to the ground
   team, with the NASA or CSA page each statement comes from.

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

## What is in it

| Screen | What it does |
|---|---|
| Body map | The figure, 12 systems and the radiation ring. The selected system reads like a short report: Findings with charts, Impression, Recommendation. With nothing selected it shows today: what is flagged, what is due, today's plan. |
| Check-in | Daily, in five steps: vitals, sleep and mood, symptoms, nutrition and exercise, radiation. Weekly: a reaction test, a vision test, height and a strength self-rating. |
| Review | The last week or month, system by system: days each symptom was reported, days spent flagged, averages against the period before and the baseline. |
| Symptom log | Every symptom day by day, 30 days at a time, and the free-text discomforts. |
| Ground report | A plain-text summary of the flagged systems to copy or download. Nothing is sent. |
| Mission | Station, Moon or Mars, and starting a real profile with its own baseline. |
| Sources | Every source page, the artwork credit, all limits, and what is simulated. |

The six indicators named by the challenge (blood pressure, heart rate, blood sugar, body temperature, sleep hours
and mood) are all recorded in the daily check-in.

## The demo is simulated

The app opens on **Crew 03**, a simulated crew member on flight day 47 of a 180-day station mission. The history is
generated from a fixed seed, so it is the same on every load: exercise is behind (Bones: caution), water intake is
low (Kidneys: warning) and trouble sleeping was reported on 3 of the last 7 days (Brain, mind & sleep: caution).
A "Simulated data" tag is on every screen while this profile is open.

The mission day does not follow the clock. **Advance one day** moves it on, so the demo looks the same whenever it
is shown. What you enter is added to the demo and saved in the browser; **Reset demo** (Sources or Mission screen)
restores the starting state.

## Where the health content comes from

Health content comes only from the five pages of the challenge's Resources tab and the NASA and CSA pages they link
to directly. The text of those 51 pages is saved in `docs/sources/`.

- Every health statement in `src/content/` carries the id of its source page and a passage that appears word for
  word in the saved page. `src/content/content.test.ts` fails if a statement has no source or its passage is not in
  the page.
- The app links each statement to its page.
- The app does not diagnose. It shows which system asks for attention and passes on what the source recommends.

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

## Türkçe özet

Crew Health, uzun görevlerdeki astronotlar için sunucusuz bir sağlık izleme uygulamasıdır. Astronot kısa bir günlük
ve haftalık kayıtla göstergelerini girer; tarama görünümlü vücut haritası 12 sistemden hangisinin ilgi istediğini
gösterir; her sistem için NASA/CSA kaynaklı açıklama ve öneriler sunulur. Arayüz İngilizcedir.

- Açılıştaki "Crew 03" profili **simülasyondur**; her ekranda "Simulated data" etiketi görünür.
- Sağlık içeriği yalnızca `docs/sources/` içindeki 51 NASA/CSA sayfasından gelir; her metnin kaynağı ve sayfada
  birebir geçen alıntısı testle denetlenir.
- **Bütün eşikler ekibin kendi ayarıdır, NASA değeri değildir** (`src/content/thresholds.ts`).
- Çizimler Wikimedia Commons'taki kamu malı çizimlerdir (Mariana Ruiz Villarreal, Mikael Häggström).
- Çalıştırmak için: `npm install`, ardından `npm run dev`. Test: `npm test`. Derleme: `npm run build`.
