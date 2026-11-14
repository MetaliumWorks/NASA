# Astronot Sağlık İzleme Uygulaması Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Astronotun sağlık göstergelerini girdiği, hangi vücut bölgesinin ilgi istediğini tarama görünümlü bir vücut haritasında gördüğü ve kaynaklı önerilerle yönlendirildiği, sunucusuz bir web uygulaması.

**Architecture:** Üç katman. `src/content` kaynak bağlantılı veriyi tutar (bölgeler, göstergeler, belirtiler, eşikler). `src/domain` saf fonksiyonlardır (durum hesabı, uzun süreli kontroller, demo verisi, rapor); arayüzden bağımsız test edilir. `src/ui` React bileşenleridir ve durumu tek bir reducer'dan alır; veri `localStorage`'da saklanır. Yönlendirme kitaplığı yok; görünüm reducer'daki bir alandır.

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, jsdom. Yazı tipleri `@fontsource-variable/instrument-sans` ve `@fontsource/martian-mono` ile projeye gömülür. Çizim işleme betiği için `@xmldom/xmldom`. Grafikler elle yazılmış SVG'dir, grafik kitaplığı yok.

**Spec:** `docs/superpowers/specs/2026-11-14-astronaut-health-monitor-design.md`. Planı uygulayan kişi ikisini birlikte okur.

## Global Constraints

- Arayüz dili İngilizce. Kod, dosya ve kimlik adları İngilizce.
- Sağlık içeriği yalnızca `docs/sources/` içindeki 51 sayfadan gelir. Her sağlık metni `source` (dosya adı, uzantısız) ve `quote` (o dosyada birebir geçen cümle parçası) taşır. Kaynakta olmayan sayı ya da iddia eklenmez.
- Eşikler ekibin ayarıdır, NASA değeri değildir; tek dosyada durur (`src/content/thresholds.ts`) ve Sources ekranında böyle yazar.
- `profile.simulated` doğruyken "Simulated data" etiketi her ekranda görünür.
- Çalışma anında ağ isteği yok: yazı tipleri, çizimler ve içerik pakete dahildir.
- Durum hiçbir yerde yalnızca renkle anlatılmaz: Nominal halka, Caution üçgen, Warning kare; yanında kelime.
- Metin karşıtlığı en az 4,5:1; görünür klavye odağı; `prefers-reduced-motion: reduce` altında bütün animasyon ve geçişler kapalı.
- Hedef genişlik 1280 piksel ve üstü; daha dar ekranda yatay taşma olmaz.
- Görsel değerler (renk, yazı, filtreler, figür) `docs/mockups/lightbox-v4.tpl.html` dosyasından birebir taşınır.
- Sayı karşılaştırmalarında `1e-9` tolerans kullanılır (36,7 + 0,5 gibi kayan nokta sınırları için).
- Her commit mesajının sonuna oturumun verdiği atıf satırları eklenir.
- Öncelik sırası: Task 1–12 P0, Task 13–18 P1, Task 19–21 P2. Her kademenin sonunda uygulama çalışır durumdadır; süre biterse orada durulur.

## Review Focus

Spec'in ima ettiği ama açıkça yazmadığı, kullanıcıyı en çok vuracak beş durum. Her birinin testi ilgili task'e eklendi.

1. **Virgüllü ya da geçersiz sayı girişi.** Türkçe klavyede "36,8" yazılır; "abc", eksi değer ya da 400 nabız girilebilir. Beklenen: virgül kabul edilir, geçersiz ve aralık dışı değer alanın yanında hata verir, hiçbir şey kaydedilmez. → Task 11.
2. **Bozuk ya da eski sürüm kayıtlı veri.** `localStorage`'daki değer geçersiz JSON ya da başka biçimde olabilir. Beklenen: uygulama beyaz ekran vermez, demo profiliyle açılır. → Task 6.
3. **Atlanmış günler ve aynı günün yeniden kaydı.** Astronot birkaç gün kayıt girmeyebilir ya da aynı adımı iki kez kaydedebilir. Beklenen: eski veri "son 3 gün" hesabına sızmaz, aynı güne ikinci kayıt çift girdi oluşturmaz. → Task 4 ve Task 6.
4. **Temel değeri olmayan ya da sıfır olan gösterge.** Beklenen: yüzde hesabında `NaN` ya da sonsuz çıkmaz; gösterge "due" görünür ve bölgeyi işaretlemez. → Task 4.
5. **Hiç kaydı olmayan profil, birinci gün.** Beklenen: bütün ekranlar açılır, grafikler "No data yet" gösterir, hiçbir bölge işaretli değildir. → Task 10.

---

## Dosya yapısı

```
index.html, package.json, vite.config.ts, tsconfig.json, .gitignore
scripts/prepare-figure.mjs          çizimleri işler, src/figure/generated/ altına yazar
src/main.tsx, src/App.tsx
src/styles/tokens.css, global.css   renk, yazı, ölçü değişkenleri
src/domain/types.ts                 bütün ortak tipler
src/domain/series.ts                değer seçme ve ortalama yardımcıları
src/domain/status.ts                günlük durum hesabı
src/domain/longterm.ts              uzun süreli kontroller
src/domain/demo.ts                  demo profili
src/domain/streak.ts, review.ts, report.ts, input.ts
src/content/sources.ts, hazards.ts, indicators.ts, symptoms.ts, regions.ts, thresholds.ts, missions.ts
src/state/store.tsx                 reducer, saklama, context
src/figure/layout.ts                organ yerleşimi, yanan kemikler, etiket yuvaları
src/figure/BodyFigure.tsx, Stars.tsx
src/figure/generated/               betiğin ürettiği dosyalar (commit edilir)
src/ui/Header.tsx, StatusGlyph.tsx, Checkbox.tsx, SourceLink.tsx
src/ui/charts/TrendChart.tsx, WeekBars.tsx, SymptomStrip.tsx
src/ui/map/MapScreen.tsx, RegionPanel.tsx, DaySummary.tsx, SystemIndex.tsx
src/ui/checkin/CheckIn.tsx, ReactionTest.tsx, VisionTest.tsx
src/ui/review/Review.tsx, src/ui/log/SymptomLog.tsx, src/ui/report/GroundReport.tsx
src/ui/sources/Sources.tsx, src/ui/setup/MissionSetup.tsx
```

Testler kaynağın yanında durur: `status.ts` → `status.test.ts`.

---

# P0

### Task 1: Proje iskeleti ve uygulama kabuğu

**Files:**
- Create: `.gitignore`, `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`, `src/styles/tokens.css`, `src/styles/global.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App` (default export, `src/App.tsx`); CSS değişkenleri `--plate`, `--bg`, `--dark`, `--bone`, `--text`, `--muted`, `--line`, `--caution`, `--warning`; yazı aileleri `--font-ui`, `--font-mono`.

- [ ] **Step 1: Depoyu başlat ve belgeleri commit et**

```bash
git init -b main
printf 'node_modules/\ndist/\n.superpowers/\n*.log\n' > .gitignore
git add .gitignore docs assets-source
git commit -m "docs: design spec, source texts, approved mockup and artwork"
git switch -c app
```

- [ ] **Step 2: Bağımlılıkları kur**

`package.json` elle yazılır (`"type": "module"`, scripts: `dev: vite`, `build: tsc -b && vite build`, `test: vitest run`, `prepare-figure: node scripts/prepare-figure.mjs`). Klasör boş olmadığı için `npm create vite` kullanılmaz.

```bash
npm install react react-dom @fontsource-variable/instrument-sans @fontsource/martian-mono
npm install -D vite @vitejs/plugin-react typescript vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom @types/node @xmldom/xmldom
```

`vite.config.ts`: React eklentisi, `base: './'` (statik yayında alt klasörde çalışsın), `test: { environment: 'jsdom', setupFiles: ['src/test-setup.ts'], globals: true }`. `src/test-setup.ts` yalnızca `@testing-library/jest-dom/vitest` içe aktarır.

- [ ] **Step 3: Başarısız testi yaz**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('shell shows the app name and a main landmark', () => {
  render(<App />);
  expect(screen.getByText('Crew Health')).toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

- [ ] **Step 4: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/App.test.tsx` · Expected: FAIL, `./App` bulunamıyor.

- [ ] **Step 5: Kabuğu yaz**

`src/styles/tokens.css`: `docs/mockups/lightbox-v4.tpl.html` içindeki `.d2{...}` bloğunun değişkenleri `:root` altına aynı değerlerle taşınır; `--font-ui: "Instrument Sans Variable", system-ui, sans-serif`, `--font-mono: "Martian Mono", monospace`. `src/styles/global.css`: kutu modeli sıfırlama, `body` arka planı `var(--plate)`, `:focus-visible` çerçevesi `2px solid var(--caution)`, ve `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`. `src/main.tsx` iki yazı tipi paketini ve iki CSS dosyasını içe aktarır. `App` şimdilik `<header>Crew Health</header><main/>` döndürür.

- [ ] **Step 6: Testi ve derlemeyi çalıştır**

Run: `npx vitest run src/App.test.tsx` · Expected: PASS. Run: `npm run build` · Expected: `dist/` oluşur, hata yok.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite React TypeScript app with test setup"
```

### Task 2: Ortak tipler, eşikler ve değer yardımcıları

**Files:**
- Create: `src/domain/types.ts`, `src/domain/series.ts`, `src/content/thresholds.ts`, `src/content/missions.ts`
- Test: `src/domain/series.test.ts`, `src/content/thresholds.test.ts`

**Interfaces:**
- Produces (`types.ts`):

```ts
export type Status = 'nominal' | 'caution' | 'warning';
export type RegionId = 'brain' | 'eyes' | 'innerEar' | 'heart' | 'lungs' | 'immune' | 'bones' | 'spine' | 'muscles' | 'digestion' | 'kidneys' | 'radiation';
export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment';
export type MissionId = 'station' | 'moon' | 'mars';
export type IndicatorId = 'heartRate' | 'bpSystolic' | 'bpDiastolic' | 'bloodSugar' | 'bodyTemp' | 'sleepHours' | 'mood' | 'exerciseHours' | 'waterLiters' | 'appetite' | 'radiationDose' | 'strength' | 'heightCm' | 'reactionMs' | 'visionLevel';
export type CheckInStep = 'vitals' | 'sleepMood' | 'symptoms' | 'intake' | 'radiation';
export const DAILY_STEPS: CheckInStep[] = ['vitals', 'sleepMood', 'symptoms', 'intake', 'radiation'];
export interface DayEntry { day: number; values: Partial<Record<IndicatorId, number>>; symptoms: string[]; otherDiscomfort?: string; journal?: string; stepsDone: CheckInStep[]; }
export interface PlanItem { day: number; recommendationId: string; done: boolean; }
export interface Profile { name: string; simulated: boolean; mission: MissionId; missionDay: number; baseline: Partial<Record<IndicatorId, number>>; entries: DayEntry[]; plan: PlanItem[]; }
```

- Produces (`series.ts`):

```ts
export function valuesFor(p: Profile, id: IndicatorId, fromDay: number, toDay: number): { day: number; value: number }[];
/** `day` ve öncesindeki en yeni `n` değer; `day - (n + 1)` gününden eski olanlar alınmaz. */
export function recent(p: Profile, id: IndicatorId, day: number, n: number): number[];
export function mean(xs: number[]): number | null;   // boş dizi → null
export function entryFor(p: Profile, day: number): DayEntry | undefined;
```

- Produces (`thresholds.ts`): `THRESHOLDS: Record<IndicatorId, ThresholdRule>`, `EXERCISE_TARGET_PER_DAY = 1.5`, `LONG_TERM = { recurring: { days: 7, count: 3 }, persistent: { days: 30, count: 10 }, sustained: { days: 30, count: 15 }, trendWeeks: 4, trendMinPerWeekValues: 4 }`.

```ts
export type ThresholdRule =
  | { kind: 'percentAvg3'; caution: number; warning: number; trendMin: number }            // iki yön, temel değerin yüzdesi
  | { kind: 'aboveLast'; caution: number; warning: number; trendMin: number }              // temel değerin üstü, mutlak
  | { kind: 'belowAvg3'; caution: number; warning: number; trendMin: number }              // temel değerin altı, mutlak
  | { kind: 'scaleAvg3'; caution: number; warning: number; trendMin: number }              // ortalama ≤ değer
  | { kind: 'fractionAvg3'; caution: number; warning: number; trendMin: number }           // ortalama / temel değer < oran
  | { kind: 'sumFraction'; days: number; caution: number; warning: number }                // toplam / hedef < oran
  | { kind: 'belowLast'; caution: number; warning: number }                                // son değer ≤ temel − değer
  | { kind: 'aboveLastPercent'; caution: number; warning?: number }                        // son değer ≥ temel × (1 + oran)
  | { kind: 'none' };
```

Değerler (spec bölüm 7; `trendMin` caution sınırının yarısı):

| Gösterge | Kural |
|---|---|
| heartRate | percentAvg3, 0.15, 0.25, trendMin 0.075 |
| bpSystolic, bpDiastolic | percentAvg3, 0.10, 0.20, trendMin 0.05 |
| bloodSugar | percentAvg3, 0.15, 0.30, trendMin 0.075 |
| bodyTemp | aboveLast, 0.5, 1.0, trendMin 0.25 |
| sleepHours | belowAvg3, 1, 2, trendMin 0.5 |
| mood, appetite | scaleAvg3, 2.5, 1.5, trendMin 0.5 |
| waterLiters | fractionAvg3, 0.8, 0.6, trendMin 0.1 |
| exerciseHours | sumFraction, days 7, 0.8, 0.5 |
| strength, visionLevel | belowLast, 1, 2 |
| heightCm | aboveLastPercent, 0.03 |
| reactionMs | aboveLastPercent, 0.15, 0.30 |
| radiationDose | none |

- Produces (`missions.ts`): `MISSIONS: Record<MissionId, { name: string; days: number; commsLine: string | null; hazards: HazardId[] }>` = station `{ 'Station', 180, 'Real-time support from the ground', ['gravity','isolation'] }`, moon `{ 'Moon', 30, null, ['gravity','radiation','distance'] }`, mars `{ 'Mars', 1095, 'Up to 20 minutes one way', ['radiation','isolation','distance','gravity','environment'] }`.

- [ ] **Step 1: Başarısız testleri yaz**

```ts
// src/domain/series.test.ts
const p = profile([{ day: 40, heartRate: 60 }, { day: 45, heartRate: 70 }, { day: 46, heartRate: 72 }, { day: 47, heartRate: 74 }]);
test('recent returns the newest n values', () => expect(recent(p, 'heartRate', 47, 3)).toEqual([70, 72, 74]));
test('recent drops stale values', () => expect(recent(p, 'heartRate', 47, 4)).toEqual([70, 72, 74])); // gün 40, 47 − 5 = 42'den eski
test('recent ignores later days', () => expect(recent(p, 'heartRate', 45, 3)).toEqual([70]));
test('mean of nothing is null', () => expect(mean([])).toBeNull());
```

Test yardımcıları `src/domain/test-helpers.ts` içinde yazılır ve sonraki task'lerin testleri bunları kullanır. Hepsi `missionDay: 47`, görev `station` olan bir `Profile` döndürür:

```ts
export function profile(rows: ({ day: number; symptoms?: string[] } & Partial<Record<IndicatorId, number>>)[], baseline?: Profile['baseline']): Profile;
export function range(from: number, to: number): number[];                                   // iki uç dahil
export function withSymptoms(day: number, ids: string[]): Profile;
export function symptomOn(days: number[], id: string): Profile;
export function heartRateDays(d: { high: number[]; normal: number[] }): Profile;             // high 70, normal 60, temel 60
export function weeklySleep(weeklyValues: [number, number, number, number]): Profile;        // eskiden yeniye; gün 20–47, temel 7.5
export function profileWithWeeklyOn(day: number, today: number): Profile;                    // dört haftalık gösterge `day` gününde kayıtlı
```

```ts
// src/content/thresholds.test.ts
test('every indicator has a rule', () => expect(Object.keys(THRESHOLDS).sort()).toEqual([...ALL_INDICATORS].sort()));
test('weekly exercise target is 10.5 h', () => expect(EXERCISE_TARGET_PER_DAY * 7).toBe(10.5));
```

`ALL_INDICATORS: IndicatorId[]` `types.ts`'den dışa aktarılır.

- [ ] **Step 2:** Run: `npx vitest run src/domain/series.test.ts src/content/thresholds.test.ts` · Expected: FAIL.
- [ ] **Step 3:** Dört dosyayı yukarıdaki imzalar ve değerlerle yaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: domain types, team-set thresholds and series helpers"`

### Task 3: Kaynaklı içerik

**Files:**
- Create: `src/content/sources.ts`, `hazards.ts`, `indicators.ts`, `symptoms.ts`, `regions.ts`
- Test: `src/content/content.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Sourced { text: string; source: string; quote: string; }
export const SOURCES: Record<string, { title: string; url: string; org: 'NASA' | 'CSA' }>;   // anahtar: docs/sources dosya adı
export const HAZARDS: Record<HazardId, { name: string; source: string }>;
export interface IndicatorDef { id: IndicatorId; label: string; unit: string; cadence: 'daily' | 'weekly'; step: CheckInStep | 'weekly'; region: RegionId; min: number; max: number; why: Sourced; howTo: string; }
export const INDICATORS: Record<IndicatorId, IndicatorDef>;
export interface SymptomDef { id: string; label: string; region: RegionId; urgent?: boolean; basis: Sourced; }
export const SYMPTOMS: SymptomDef[];
export interface Recommendation { id: string; text: string; basis: Sourced | null; kind?: 'groundReport'; }
export interface RegionDef { id: RegionId; name: string; hazards: HazardId[]; indicators: IndicatorId[]; related?: IndicatorId[]; impression: Sourced[]; function?: Sourced; recommendations: Recommendation[]; }
export const REGIONS: Record<RegionId, RegionDef>;
export const REGION_ORDER: RegionId[];   // spec bölüm 6 sırası
```

İçerik kuralları:

- `SOURCES` 51 dosyanın hepsini içerir; `url` dosyanın ilk satırındaki `SOURCE:` adresidir; `title` sayfanın kendi başlığıdır (dosyadaki ilk başlık satırı); `org` dosya adı `csa-` ile başlıyorsa `CSA`, değilse `NASA`.
- Her gösterge tek bir bölgeye aittir (`INDICATORS[id].region`) ve yalnızca o bölgenin durumunu belirler. `exerciseHours` Bones'a aittir; Muscles onu `related` içinde taşır, yani Findings'te gösterir ama durumu ondan etkilenmez. Muscles'ın kendi göstergesi `strength`'tir.
- Ground-report önerisinin kimliği `groundReport-<bölge kimliği>` biçimindedir.
- `quote`, `docs/sources/<source>.txt` içinde birebir geçen bir parçadır. `text` aynı cümle ya da ona sadık, sade bir özettir.
- `basis: null` yalnızca `kind: 'groundReport'` önerisinde olabilir (`text: 'Add to the next ground report'`, her bölgede bir tane).
- Bölge adları, tehlikeler ve göstergeler spec bölüm 6 tablosundaki gibidir. Girdi aralıkları (`min`–`max`): heartRate 30–220, bpSystolic 60–250, bpDiastolic 30–150, bloodSugar 20–600, bodyTemp 30–43, sleepHours 0–24, mood 1–5, exerciseHours 0–8, waterLiters 0–10, appetite 1–5, radiationDose 0–1000, strength 1–5, heightCm 100–230, reactionMs 100–2000, visionLevel 0–8. Birimler: bpm, mmHg, mmHg, mg/dL, °C, h, 1–5, h, L, 1–5, mSv, 1–5, cm, ms, level.
- Haftalık göstergeler: strength, heightCm, reactionMs, visionLevel. Günlük adımlar: vitals = heartRate, bpSystolic, bpDiastolic, bodyTemp, bloodSugar; sleepMood = sleepHours, mood; intake = waterLiters, appetite, exerciseHours; radiation = radiationDose.

Belirtiler ve öneriler (kimlik · kaynak dosyası). Uygulayan kişi her biri için o dosyadan birebir alıntıyı seçer:

| Bölge | Belirtiler | Öneriler | İşlev satırı |
|---|---|---|---|
| brain | anxiety, lowMood (risk-behavioral); troubleSleeping (risk-sleep); troubleConcentrating (hazard-radiation) | journal, talkToFamily, windowTime (risk-behavioral); relaxTime, lightCycle (risk-sleep) | yok |
| eyes | blurredVision (hazard-gravity) | runVisionCheck (study-cipher) | yok |
| innerEar | motionSickness, disorientation (risk-sensorimotor); dizziness (hazard-gravity) | adjustBeforeTasks (hazard-gravity) | study-cipher ("orientation and balance") |
| heart | lightheaded (hazard-gravity); irregularHeartbeat (risk-cardiovascular) | exerciseAndDiet, fluidsAndCompression (risk-cardiovascular) | yok |
| lungs | headache, confusion (risk-hypoxia); painAfterSpacewalk, `urgent` (risk-decompression) | endSpacewalk (risk-decompression); prebreathe (risk-eva) | yok |
| immune | coldSores, rash, allergy, infection (risk-immune) | collectSample (risk-immune) | past-altered-immunity |
| bones | yok | resistiveExercise (risk-bone); dailyExercise (risk-fitness); drinkToPlan (hazard-gravity) | risk-bone ("support the human body") |
| spine | yok | spineExercise (past-spinal-health) | past-spinal-health ("structural support") |
| muscles | yok | dailyExercise, fitnessSelfEvaluation (risk-fitness) | yok |
| digestion | menuFatigue (risk-nutrition) | variedMeals (risk-nutrition); balancedDiet (risk-cardiovascular) | yok |
| kidneys | yok | drinkMore (hazard-gravity) | yok |
| radiation | yok | logDosimeter (risk-radiation-cancer) | yok |

Aynı öneri kimliği iki bölgede geçiyorsa (`dailyExercise`) tek bir nesne paylaşılır. Göstergelerin `why` kaynakları: heartRate, bpSystolic, bpDiastolic → risk-cardiovascular; bloodSugar → csa-body-infographic; bodyTemp → risk-immune; sleepHours → risk-sleep; mood → risk-behavioral; exerciseHours, strength → risk-fitness; waterLiters → hazard-gravity; appetite → risk-nutrition; radiationDose → risk-radiation-cancer; heightCm → risk-bone; reactionMs → study-standard-measures; visionLevel → study-cipher. `impression` için bölge başına en az bir, en çok üç madde; kaynak dosyaları spec bölüm 6'nın son sütunundadır.

- [ ] **Step 1: Başarısız testi yaz**

```ts
// src/content/content.test.ts
import { readFileSync, readdirSync } from 'node:fs';
const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const file = (id: string) => norm(readFileSync(`docs/sources/${id}.txt`, 'utf8'));
const allSourced: Sourced[] = [/* impression, function, why, belirti basis, öneri basis: hepsi */];

test('SOURCES covers every saved page', () =>
  expect(Object.keys(SOURCES).sort()).toEqual(readdirSync('docs/sources').map(f => f.replace('.txt', '')).sort()));
test('every health text names a known source', () => allSourced.forEach(s => expect(SOURCES[s.source], s.text).toBeDefined()));
test('every quote appears verbatim in its source page', () =>
  allSourced.forEach(s => expect(file(s.source).includes(norm(s.quote)), `${s.source}: ${s.quote}`).toBe(true)));
test('quotes are real sentences, not fragments', () => allSourced.forEach(s => expect(norm(s.quote).length).toBeGreaterThanOrEqual(20)));
test('all 12 regions exist with an impression and a ground-report item', () => {
  expect(REGION_ORDER).toHaveLength(12);
  REGION_ORDER.forEach(id => {
    expect(REGIONS[id].impression.length).toBeGreaterThanOrEqual(1);
    expect(REGIONS[id].recommendations.filter(r => r.kind === 'groundReport')).toHaveLength(1);
  });
});
test('only the ground-report item may lack a basis', () =>
  REGION_ORDER.flatMap(id => REGIONS[id].recommendations).forEach(r => expect(r.basis === null).toBe(r.kind === 'groundReport')));
test('the six indicators named by the challenge are present', () =>
  ['bpSystolic', 'heartRate', 'bloodSugar', 'bodyTemp', 'sleepHours', 'mood'].forEach(id => expect(INDICATORS[id as IndicatorId]).toBeDefined()));
test('each symptom and indicator belongs to a real region', () => {
  SYMPTOMS.forEach(s => expect(REGIONS[s.region]).toBeDefined());
  ALL_INDICATORS.forEach(id => expect(REGIONS[INDICATORS[id].region].indicators).toContain(id));
});
test('symptom ids are unique', () => expect(new Set(SYMPTOMS.map(s => s.id)).size).toBe(SYMPTOMS.length));
```

- [ ] **Step 2:** Run: `npx vitest run src/content/content.test.ts` · Expected: FAIL.
- [ ] **Step 3:** Beş içerik dosyasını yaz. Her alıntı için ilgili `docs/sources/*.txt` dosyası açılır ve cümle oradan kopyalanır; ezberden yazılmaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS. Bir alıntı testi geçmiyorsa test gevşetilmez; alıntı dosyadaki haline düzeltilir ya da madde çıkarılır.
- [ ] **Step 5:** `git add -A && git commit -m "feat: sourced content for 12 regions with verbatim-quote check"`

### Task 4: Günlük durum hesabı

**Files:**
- Create: `src/domain/status.ts`
- Test: `src/domain/status.test.ts`

**Interfaces:**
- Consumes: `recent`, `mean`, `entryFor` (Task 2); `THRESHOLDS`, `EXERCISE_TARGET_PER_DAY`; `REGIONS`, `SYMPTOMS`, `INDICATORS` (Task 3).
- Produces:

```ts
export type FlagLabel = 'recurring' | 'persistent' | 'sustained' | 'trending';
export interface Finding { indicator?: IndicatorId; symptom?: string; status: Status; due: boolean; value: number | null; label?: FlagLabel; reason: string; }
export interface Assessment { region: RegionId; status: Status; findings: Finding[]; }
export function worst(a: Status, b: Status): Status;
export function indicatorStatus(p: Profile, id: IndicatorId, day: number): Finding;
export function symptomFindings(p: Profile, region: RegionId, day: number): Finding[];
export function assessDaily(p: Profile, region: RegionId, day: number): Assessment;
export function expectedBoneLoss(day: number): { min: number; max: number };   // yüzde
```

Kurallar: `Avg3` türleri `mean(recent(p, id, day, 3))`, `Last` türleri `recent(p, id, day, 1)[0]`, `sumFraction` `recent(p, id, day, 7)` toplamının `EXERCISE_TARGET_PER_DAY * 7`'ye oranını kullanır. Değer yoksa ya da temel değer gerekip de tanımsız ya da 0 ise `{ status: 'nominal', due: true, value: null }` döner. `scaleAvg3` ve `sumFraction` temel değer istemez. `reason` İngilizce kısa cümledir, örnek: `'3-day average 70 bpm, 16.7% above baseline'`.

- [ ] **Step 1: Başarısız testleri yaz.** Her satır bir `test`; `st(id, baseline, values)` yardımcısı son günleri verilen değerlerle dolu bir profil kurup `indicatorStatus(...).status` döndürür.

| Durum | Girdi | Beklenen |
|---|---|---|
| heartRate, temel 60 | 66,66,66 / 70,70,70 / 76,76,76 / 50,50,50 | nominal / caution / warning / caution |
| bpSystolic, temel 120 | 133,133,133 / 145,145,145 | caution / warning |
| bloodSugar, temel 90 | 104,104,104 / 118,118,118 | caution / warning |
| bodyTemp, temel 36.7 | son 37.1 / 37.2 / 37.7 | nominal / caution / warning |
| sleepHours, temel 7.5 | 6.6×3 / 6.5×3 / 5.5×3 | nominal / caution / warning |
| mood | 2.6 ort. (3,3,2 → 2.67) / 2,3,2.5 → 2.5 / 1,2,1.5 → 1.5 | nominal / caution / warning |
| waterLiters, temel 2.4 | 1.92×3 / 1.9×3 / 1.4×3 | nominal / caution / warning |
| exerciseHours, 7 gün | toplam 8.4 / 8.3 / 5.2 | nominal / caution / warning |
| strength, temel 4 | son 3 / 2 | caution / warning |
| heightCm, temel 178 | son 183 / 183.5 | nominal / caution |
| reactionMs, temel 280 | son 322 / 364 | caution / warning |
| visionLevel, temel 6 | son 5 / 4 | caution / warning |
| radiationDose | herhangi | nominal, `due: false` |

```ts
test('no values means due, not flagged', () => {
  const f = indicatorStatus(profile([], { heartRate: 60 }), 'heartRate', 10);
  expect(f).toMatchObject({ status: 'nominal', due: true, value: null });
});
test('missing or zero baseline never produces NaN', () => {
  for (const base of [undefined, 0]) {
    const f = indicatorStatus(profile([{ day: 10, heartRate: 70 }], { heartRate: base }), 'heartRate', 10);
    expect(f.due).toBe(true); expect(f.status).toBe('nominal'); expect(f.reason).not.toMatch(/NaN|Infinity/);
  }
});
test('a skipped week does not leak old values into today', () => {
  const p = profile([{ day: 30, heartRate: 90 }, { day: 31, heartRate: 90 }, { day: 32, heartRate: 90 }], { heartRate: 60 });
  expect(indicatorStatus(p, 'heartRate', 47).due).toBe(true);
});
test('symptoms: one is caution, two are warning, an urgent one is warning', () => {
  expect(assessDaily(withSymptoms(47, ['headache']), 'lungs', 47).status).toBe('caution');
  expect(assessDaily(withSymptoms(47, ['headache', 'confusion']), 'lungs', 47).status).toBe('warning');
  expect(assessDaily(withSymptoms(47, ['painAfterSpacewalk']), 'lungs', 47).status).toBe('warning');
});
test('yesterday\'s symptom does not flag today', () => expect(assessDaily(withSymptoms(46, ['headache']), 'lungs', 47).status).toBe('nominal'));
test('region takes its worst finding', () => { /* heart: nabız caution + tansiyon warning → warning */ });
test('expected bone loss follows 1% to 1.5% per 30 days', () => {
  expect(expectedBoneLoss(30)).toEqual({ min: 1, max: 1.5 });
  expect(expectedBoneLoss(47).min).toBeCloseTo(1.567, 3); expect(expectedBoneLoss(47).max).toBeCloseTo(2.35, 3);
});
```

- [ ] **Step 2:** Run: `npx vitest run src/domain/status.test.ts` · Expected: FAIL.
- [ ] **Step 3:** `status.ts`'i yaz. Her `ThresholdRule` türü için bir dal. Sınırın kendisi işaretlenir (`1e-9` toleransla "eşit ya da ötesi"); iki istisna `sumFraction` ve `fractionAvg3`'tür, bunlar kesin küçüktür (tam %80 nominal sayılır).
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: daily status engine against personal baseline"`

### Task 5: Uzun süreli kontroller

**Files:**
- Create: `src/domain/longterm.ts`
- Modify: `src/domain/status.ts` (yalnızca `assessRegion`, `assessAll` eklenir)
- Test: `src/domain/longterm.test.ts`

**Interfaces:**
- Consumes: `indicatorStatus`, `assessDaily`, `worst`, `Finding` (Task 4); `LONG_TERM`, `THRESHOLDS`.
- Produces:

```ts
export function longTermFindings(p: Profile, region: RegionId, day: number): Finding[];   // longterm.ts
export function assessRegion(p: Profile, region: RegionId, day: number): Assessment;      // günlük + uzun süreli, en ağırı
export function assessAll(p: Profile, day: number): Record<RegionId, Assessment>;
```

Kurallar (spec bölüm 7): aynı belirti son 7 günün 3'ünde → caution `recurring`; son 30 günün 10'unda → warning `persistent`; bir gösterge son 30 günün 15'inde caution ya da daha kötü → warning `sustained`; yavaş kayma → caution `trending`. Yavaş kayma: hafta `k` = `[day − 7k − 6, day − 7k]`, `k = 0..3`; her haftada en az 4 değer; sapma göstergenin "kötü" yönünde ölçülür (`percentAvg3` iki yön mutlak, `belowAvg3`, `scaleAvg3`, `fractionAvg3` aşağı, `aboveLast` yukarı); dört haftanın sapmaları kesin artan olmalı ve son ile ilk haftanın farkı `trendMin`'den küçük olmamalı (`percentAvg3` ve `fractionAvg3` için temel değerin oranı, diğerleri mutlak). `trendMin`'i olmayan kural türlerinde yavaş kayma yoktur.

- [ ] **Step 1: Başarısız testleri yaz**

```ts
test('same symptom on 3 of the last 7 days is recurring', () => {
  const f = longTermFindings(symptomOn([41, 43, 45], 'troubleSleeping'), 'brain', 47);
  expect(f).toEqual([expect.objectContaining({ symptom: 'troubleSleeping', status: 'caution', label: 'recurring' })]);
});
test('2 of the last 7 days is not recurring', () => expect(longTermFindings(symptomOn([43, 45], 'troubleSleeping'), 'brain', 47)).toEqual([]));
test('10 of the last 30 days is persistent', () => {
  const days = [18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
  expect(longTermFindings(symptomOn(days, 'rash'), 'immune', 47)[0]).toMatchObject({ status: 'warning', label: 'persistent' });
});
test('an indicator at caution on 15 of the last 30 days is sustained', () => {
  const p = heartRateDays({ high: range(18, 32), normal: range(33, 47) });       // 15 gün 70, 15 gün 60; temel 60
  expect(longTermFindings(p, 'heart', 47)).toContainEqual(expect.objectContaining({ indicator: 'heartRate', status: 'warning', label: 'sustained' }));
});
test('sleep drifting 7.5 → 7.2 → 6.95 → 6.7 over four weeks is trending', () => {
  const f = longTermFindings(weeklySleep([7.5, 7.2, 6.95, 6.7]), 'brain', 47);
  expect(f).toContainEqual(expect.objectContaining({ indicator: 'sleepHours', status: 'caution', label: 'trending' }));
});
test('a drift below the floor is not trending', () => expect(longTermFindings(weeklySleep([7.5, 7.4, 7.3, 7.2]), 'brain', 47)).toEqual([]));
test('a drift that reverses is not trending', () => expect(longTermFindings(weeklySleep([7.5, 6.9, 7.3, 6.7]), 'brain', 47)).toEqual([]));
test('fewer than 4 values in a week gives no trend', () => { /* son haftada 3 kayıt → [] */ });
test('assessRegion is the worst of daily and long-term', () =>
  expect(assessRegion(symptomOn([41, 43, 45], 'troubleSleeping'), 'brain', 47).status).toBe('caution'));
test('reasons say how often', () =>
  expect(longTermFindings(symptomOn([41, 43, 45, 46], 'troubleSleeping'), 'brain', 47)[0].reason).toBe('Reported on 4 of the last 7 days'));
```

- [ ] **Step 2:** Run: `npx vitest run src/domain/longterm.test.ts` · Expected: FAIL.
- [ ] **Step 3:** `longterm.ts`'i yaz; `status.ts`'e `assessRegion` ve `assessAll` ekle.
- [ ] **Step 4:** Run: `npx vitest run src/domain` · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: weekly and monthly long-term checks"`

### Task 6: Demo profili ve durum deposu

**Files:**
- Create: `src/domain/demo.ts`, `src/domain/streak.ts`, `src/state/store.tsx`
- Test: `src/domain/demo.test.ts`, `src/state/store.test.ts`

**Interfaces:**
- Consumes: `assessAll` (Task 5); `MISSIONS`; `DAILY_STEPS`.
- Produces:

```ts
export function createDemoProfile(): Profile;                 // demo.ts, sabit tohum 20261114
export function emptyProfile(name: string, mission: MissionId, baseline: Profile['baseline']): Profile;   // gün 1, kayıt yok
export function streak(p: Profile): number;                   // streak.ts
export function stepsDoneToday(p: Profile): number;
export type View = 'map' | 'checkin' | 'review' | 'log' | 'report' | 'sources' | 'setup';
export interface AppState { profile: Profile; view: View; selectedRegion: RegionId | null; showOrgans: boolean; }
export type Action =
  | { type: 'view'; view: View } | { type: 'select'; region: RegionId | null } | { type: 'toggleOrgans' }
  | { type: 'saveStep'; step: CheckInStep; values: Partial<Record<IndicatorId, number>>; symptoms?: string[]; otherDiscomfort?: string; journal?: string }
  | { type: 'saveWeekly'; values: Partial<Record<IndicatorId, number>> }
  | { type: 'advanceDay' } | { type: 'resetDemo' } | { type: 'setMission'; mission: MissionId }
  | { type: 'planAdd'; ids: string[] } | { type: 'planToggle'; id: string }
  | { type: 'newProfile'; name: string; mission: MissionId; baseline: Profile['baseline'] };
export const STORAGE_KEY = 'crew-health/v1';
export function reducer(s: AppState, a: Action): AppState;
export function loadState(storage: Pick<Storage, 'getItem'>): AppState;
export function saveState(storage: Pick<Storage, 'setItem'>, s: AppState): void;
export function AppProvider(props: { children: React.ReactNode; initial?: AppState }): JSX.Element;
export function useApp(): { state: AppState; dispatch: React.Dispatch<Action> };
```

Demo (spec bölüm 10): `name: 'Crew 03'`, `simulated: true`, görev `station`, `missionDay: 47`. Temel değerler: heartRate 62, bpSystolic 118, bpDiastolic 76, bloodSugar 90, bodyTemp 36.7, sleepHours 7.5, mood 4, waterLiters 2.4, appetite 4, strength 4, heightCm 178, reactionMs 280, visionLevel 6. Gün 1–46 beş adımı tamam, yalnızca gün 34 eksik (seri 12 çıksın); gün 47'de `stepsDone: ['vitals','sleepMood','symptoms']`. Egzersiz gün 40–46: `1.5, 1.0, 0.5, 1.5, 1.0, 0, 1.0`. Su gün 44–46: `1.4, 1.3, 1.1`. `troubleSleeping` gün 41, 43, 45. `motionSickness` gün 1–4. Geri kalan değerler temel değerin etrafında, hiçbir eşiği ve uzun süreli kontrolü tetiklemeyecek kadar küçük, tohumlu gürültüyle üretilir. Haftalık göstergeler her 7 günde bir temel değere yakın kaydedilir.

Reducer kuralları: `saveStep` bugünün (`missionDay`) kaydını bulur ya da oluşturur, değerleri birleştirir, adımı `stepsDone`'a bir kez ekler. `advanceDay` günü bir artırır; görev süresine ulaşınca değişmez. `planAdd` bugünün planına yalnızca henüz olmayan kimlikleri ekler. `loadState` şu durumlarda `{ profile: createDemoProfile(), view: 'map', selectedRegion: null, showOrgans: false }` döner: anahtar yok, JSON bozuk, `profile.entries` dizi değil.

- [ ] **Step 1: Başarısız testleri yaz**

```ts
// src/domain/demo.test.ts
const demo = createDemoProfile();
test('demo is deterministic', () => expect(createDemoProfile()).toEqual(demo));
test('demo tells the spec story and nothing else', () => {
  const a = assessAll(demo, 47);
  expect(a.kidneys.status).toBe('warning');
  expect(a.bones.status).toBe('caution');
  expect(a.brain.status).toBe('caution');
  expect(a.brain.findings).toContainEqual(expect.objectContaining({ symptom: 'troubleSleeping', label: 'recurring' }));
  (['eyes', 'innerEar', 'heart', 'lungs', 'immune', 'spine', 'muscles', 'digestion', 'radiation'] as RegionId[])
    .forEach(r => expect(a[r].status, r).toBe('nominal'));
});
test('demo matches the mockup numbers', () => {
  expect(recent(demo, 'exerciseHours', 47, 7).reduce((x, y) => x + y, 0)).toBeCloseTo(6.5);
  expect(streak(demo)).toBe(12);
  expect(stepsDoneToday(demo)).toBe(3);
  expect(demo.simulated).toBe(true);
});
test('the early motion-sickness cluster is in the log but not flagged', () =>
  expect(demo.entries.filter(e => e.symptoms.includes('motionSickness')).map(e => e.day)).toEqual([1, 2, 3, 4]));

// src/state/store.test.ts
test('corrupt storage falls back to the demo', () => {
  for (const raw of [null, '{not json', '{"profile":{"entries":"x"}}', '[]'])
    expect(loadState({ getItem: () => raw }).profile).toEqual(createDemoProfile());
});
test('saveState then loadState round-trips', () => { /* Map tabanlı sahte storage */ });
test('saving the same step twice keeps one entry and one step mark', () => {
  let s = reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 2 } });
  s = reducer(s, { type: 'saveStep', step: 'intake', values: { waterLiters: 2.2 } });
  const today = s.profile.entries.filter(e => e.day === 47);
  expect(today).toHaveLength(1);
  expect(today[0].values.waterLiters).toBe(2.2);
  expect(today[0].stepsDone.filter(x => x === 'intake')).toHaveLength(1);
  expect(today[0].values.heartRate).toBeDefined();              // önceki adımların değerleri durur
});
test('advanceDay stops at the mission length', () => { /* gün 180'de advanceDay → 180 */ });
test('resetDemo restores the starting profile', () => { /* değişiklikten sonra resetDemo → createDemoProfile() */ });
test('planAdd does not duplicate', () => { /* aynı kimlik iki kez → tek madde */ });
test('streak counts back from yesterday when today is incomplete', () => { /* tamam günler 44,45,46; bugün eksik → 3 */ });
test('a gap breaks the streak', () => { /* tamam 43,45,46 → 2 */ });
```

- [ ] **Step 2:** Run: `npx vitest run src/domain/demo.test.ts src/state/store.test.ts` · Expected: FAIL.
- [ ] **Step 3:** Üç dosyayı yaz. `AppProvider` her durum değişikliğinde `saveState(localStorage, state)` çağırır.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: seeded demo profile, persisted store and streak"`

### Task 7: Çizimlerin işlenmesi

**Files:**
- Create: `scripts/prepare-figure.mjs`, `src/figure/generated/skeleton.ts`, `src/figure/generated/organs/*.png` (betiğin çıktısı), `src/figure/layout.ts`
- Test: `src/figure/generated.test.ts`

**Interfaces:**
- Produces: `SKELETON_DEFS: string`, `SKELETON_MARKUP: string` (`generated/skeleton.ts`); organ dosyaları `brain.png`, `lungs.png`, `heart.png`, `liver.png`, `stomach.png`, `intestines.png`, `kidneys.png`.
- Produces (`layout.ts`):

```ts
export const VIEWBOX = '-161.9 -28 729.7 926.2';
export interface OrganArt { file: string; region: RegionId; x: number; y: number; w: number; h: number; clipBottom?: number; }
export const ORGANS: OrganArt[];
export const HOT_BONES: Partial<Record<RegionId, string[]>>;
export const MARKERS: Partial<Record<RegionId, { cx: number; cy: number; r: number }[]>>;
export const CALLOUTS: Partial<Record<RegionId, { from: [number, number]; to: [number, number]; side: 'left' | 'right' }>>;
```

Betik, `docs/mockups/build_v4.py`'nin Node karşılığıdır; aynı kimlikleri kullanır. İskelet: `assets-source/Human_skeleton_front_-_no_labels.svg` içinden `#layer3` ve bütün gradyanlar alınır; `sodipodi`, `inkscape` ve `xml` ad alanlı öznitelikler silinir; `HumerusRight, UlnaRight, RadiusRight, HandRight, g1753` çıkarılır; `HumerusLeft, RadiusLeft, UlnaLeft, HandLeft, path1679, path1681, path1683` kopyalanıp kimliklerine `-m` eklenerek `<g id="ArmRightMirrored" transform="translate(406 0) scale(-1 1)">` içine konur. Organlar: `assets-source/Man_shadow_anatomy_expanded_and_with_DVT.svg` içindeki `<image>` öğelerinin `data:` adresi çözülüp PNG olarak yazılır.

`ORGANS` (kaynak kimliği → dosya, bölge, x, y, w, h):

| Kaynak kimliği | Dosya | Bölge | x, y, w, h |
|---|---|---|---|
| image2204-9 | brain.png | brain | 170, 24, 66, 58 |
| image7849 | lungs.png | lungs | 144, 143, 119, 107 |
| image3855 | heart.png | heart | 177, 142, 59, 94 |
| image10296 | liver.png | digestion | 147.5, 235, 100, 70.5 |
| image3706 | stomach.png | digestion | 167, 233, 100, 83 |
| image2224-4 | intestines.png | digestion | 140, 290, 126, 114 |
| image6280 | kidneys.png | kidneys | 150.6, 265.5, 108.4, 155, `clipBottom: 0.61` |

`HOT_BONES`: bones = `LumbarVertebrae, ThoracicVertebrae, Sacrum, Coccyx, PelvicGirdle, FemurLeft, g3760, path481, path499, g447`; spine = `CervicalVertebrae, ThoracicVertebrae, LumbarVertebrae, Sacrum, Coccyx`. `MARKERS`: eyes = (189,74,6.5), (217,74,6.5); innerEar = (173,84,4), (233,84,4).

`CALLOUTS` (etiket yuvaları; aynı sütunda en az 55 birim aralık):

| Bölge | from | to | side |
|---|---|---|---|
| brain | 203,48 | 262,44 | right |
| innerEar | 233,84 | 262,100 | right |
| heart | 215,225 | 350,215 | right |
| kidneys | 252,289 | 350,289 | right |
| digestion | 240,340 | 350,350 | right |
| muscles | 250,480 | 300,540 | right |
| eyes | 189,74 | 144,74 | left |
| immune | 180,130 | 140,130 | left |
| lungs | 160,215 | 62,215 | left |
| spine | 195,300 | 50,300 | left |
| bones | 150,540 | 106,540 | left |

Radiation'ın etiket yuvası yoktur.

- [ ] **Step 1: Başarısız testi yaz**

```ts
// src/figure/generated.test.ts
import { readFileSync } from 'node:fs';
test('skeleton has a mirrored right arm and no crossed forearm', () => {
  expect(SKELETON_MARKUP).toContain('id="ArmRightMirrored"');
  expect(SKELETON_MARKUP).toContain('id="HandLeft-m"');
  for (const gone of ['HumerusRight', 'UlnaRight', 'RadiusRight', 'HandRight']) expect(SKELETON_MARKUP).not.toContain(`id="${gone}"`);
});
test('editor metadata is stripped', () => expect(SKELETON_MARKUP).not.toMatch(/sodipodi:|inkscape:/));
test('every hot bone id exists in the drawing', () =>
  Object.values(HOT_BONES).flat().forEach(id => expect(SKELETON_MARKUP, id).toContain(`id="${id}"`)));
test('every organ file is a PNG', () => ORGANS.forEach(o =>
  expect(readFileSync(`src/figure/generated/organs/${o.file}`).subarray(1, 4).toString()).toBe('PNG')));
test('gradients referenced by the bones are included', () => expect(SKELETON_DEFS).toMatch(/<(linear|radial)Gradient/));
```

- [ ] **Step 2:** Run: `npx vitest run src/figure/generated.test.ts` · Expected: FAIL.
- [ ] **Step 3:** Betiği ve `layout.ts`'i yaz; `npm run prepare-figure` çalıştır. Çıktılar commit edilir, böylece uygulama betik çalıştırılmadan derlenir.
- [ ] **Step 4:** Aynı test komutu · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: prepare public-domain skeleton and organ artwork"`

### Task 8: Vücut figürü

**Files:**
- Create: `src/figure/BodyFigure.tsx`, `src/figure/Stars.tsx`, `src/figure/figure.css`, `src/ui/StatusGlyph.tsx`
- Test: `src/figure/BodyFigure.test.tsx`

**Interfaces:**
- Consumes: `SKELETON_DEFS`, `SKELETON_MARKUP`, `ORGANS`, `HOT_BONES`, `MARKERS`, `CALLOUTS`, `VIEWBOX` (Task 7); `REGIONS`.
- Produces:

```ts
export interface BodyFigureProps { statuses: Record<RegionId, Status>; selected: RegionId | null; showOrgans: boolean; onSelect(region: RegionId): void; }
export function BodyFigure(props: BodyFigureProps): JSX.Element;
export function Stars(props: { width: number; height: number; dimFromX: number }): JSX.Element;   // sabit tohumlu canvas
export function StatusGlyph(props: { status: Status; label?: boolean }): JSX.Element;             // halka, üçgen, kare + isteğe bağlı kelime
```

DOM sözleşmesi: figür `role="img"` ve durumu özetleyen `aria-label` taşır (örnek: `'Body scan. Kidneys: warning. Bones: caution. 10 systems nominal.'`). Her organ ve işaret `data-region` ve `data-status` özniteliklidir, `role="button"`, `tabIndex=0`, Enter ve boşlukla seçilir. Organ katmanı `data-testid="organs"`; `showOrgans` yanlışken yalnızca durumu `nominal` olmayan bölgelerin organları çizilir. Yanan kemikler `hot-caution` ya da `hot-warning` sınıfı alır (Bones ve Spine çakışırsa ağır olan). Durumu `nominal` olmayan her bölge için `CALLOUTS` yuvasında bölge adı ve küçük harfle durum kelimesi yazılır. Filtreler (`#xr`, `#xc`, `#xo`, `#xw`, `#skin`), vücut hacmi şekilleri (`#body` grubu), R ve L işaretleri ve radyasyon halkası `docs/mockups/lightbox-v4.tpl.html`'den birebir taşınır. İskelet `dangerouslySetInnerHTML` ile basılır; sınıflar `useLayoutEffect` içinde kimlikle atanır.

- [ ] **Step 1: Başarısız testleri yaz**

```tsx
const nominal = Object.fromEntries(REGION_ORDER.map(r => [r, 'nominal'])) as Record<RegionId, Status>;
const flagged = { ...nominal, kidneys: 'warning', bones: 'caution' } as Record<RegionId, Status>;

test('flagged regions are named with their status', () => {
  render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={() => {}} />);
  expect(screen.getByRole('img')).toHaveAccessibleName(/Kidneys: warning\. Bones: caution\./);
  expect(screen.getByText('Kidneys')).toBeInTheDocument(); expect(screen.getByText('warning')).toBeInTheDocument();
});
test('organs stay hidden when nothing is wrong', () => {
  const { container } = render(<BodyFigure statuses={nominal} selected={null} showOrgans={false} onSelect={() => {}} />);
  expect(container.querySelectorAll('[data-testid="organs"] image')).toHaveLength(0);
});
test('a flagged organ shows even with organs hidden', () => {
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={() => {}} />);
  expect(container.querySelectorAll('image[data-region="kidneys"][data-status="warning"]')).toHaveLength(1);
  expect(container.querySelectorAll('image[data-region="lungs"]')).toHaveLength(0);
});
test('showOrgans reveals every organ', () => {
  const { container } = render(<BodyFigure statuses={nominal} selected={null} showOrgans onSelect={() => {}} />);
  expect(container.querySelectorAll('image[data-region]')).toHaveLength(ORGANS.length);
});
test('weight-bearing bones light up for Bones', () => {
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={() => {}} />);
  expect(container.querySelector('#FemurLeft')).toHaveClass('hot-caution');
  expect(container.querySelector('#g3760')).toHaveClass('hot-caution');
  expect(container.querySelector('#HumerusLeft')).not.toHaveClass('hot-caution');
});
test('spine takes the worse of Bones and Spine', () => {
  const { container } = render(<BodyFigure statuses={{ ...flagged, spine: 'warning' }} selected={null} showOrgans={false} onSelect={() => {}} />);
  expect(container.querySelector('#LumbarVertebrae')).toHaveClass('hot-warning');
  expect(container.querySelector('#FemurLeft')).toHaveClass('hot-caution');
});
test('organs are selectable by click and keyboard', async () => {
  const onSelect = vi.fn();
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans onSelect={onSelect} />);
  await userEvent.click(container.querySelector('image[data-region="heart"]')!);
  (container.querySelector('image[data-region="lungs"]') as SVGElement).focus(); await userEvent.keyboard('{Enter}');
  expect(onSelect.mock.calls.map(c => c[0])).toEqual(['heart', 'lungs']);
});
test('status glyphs differ by shape, not only colour', () => {
  const { container } = render(<><StatusGlyph status="nominal" /><StatusGlyph status="caution" /><StatusGlyph status="warning" /></>);
  expect(container.querySelector('circle')).not.toBeNull(); expect(container.querySelector('path')).not.toBeNull(); expect(container.querySelector('rect')).not.toBeNull();
});
```

- [ ] **Step 2:** Run: `npx vitest run src/figure/BodyFigure.test.tsx` · Expected: FAIL.
- [ ] **Step 3:** Bileşenleri yaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: scan-style body figure that lights the problem in place"`

### Task 9: Grafikler

**Files:**
- Create: `src/ui/charts/TrendChart.tsx`, `WeekBars.tsx`, `SymptomStrip.tsx`, `charts.css`
- Test: `src/ui/charts/charts.test.tsx`

**Interfaces:**
- Produces:

```ts
export function TrendChart(p: { label: string; unit: string; points: { day: number; value: number }[]; baseline?: number; missionDay: number }): JSX.Element;
export function WeekBars(p: { label: string; values: (number | null)[]; target: number; unit: string }): JSX.Element;   // 7 değer, eskiden yeniye
export function SymptomStrip(p: { label: string; reportedDays: number[]; endDay: number; span?: number }): JSX.Element;  // varsayılan span 30
```

Her grafik `role="img"` ve sayıları söyleyen bir `aria-label` taşır; `SymptomStrip` için biçim `"{label}, reported on {n} of {span} days"`. `TrendChart` görev başından `missionDay`'e uzanır; temel değer kesikli çizgidir; son nokta değeriyle etiketlenir. Nokta yoksa `No data yet` metni gösterilir ve çizgi çizilmez.

- [ ] **Step 1: Başarısız testleri yaz**

```tsx
test('trend chart draws one line through every point and labels the last value', () => {
  const { container } = render(<TrendChart label="Water" unit="L" baseline={2.4} missionDay={47} points={[{ day: 45, value: 1.3 }, { day: 46, value: 1.1 }]} />);
  expect(container.querySelector('[data-testid="trend-line"]')!.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(2);
  expect(container.querySelector('[data-testid="baseline"]')).not.toBeNull();
  expect(screen.getByRole('img')).toHaveAccessibleName('Water, latest 1.1 L, baseline 2.4 L');
});
test('trend chart with no data says so', () => {
  const { container } = render(<TrendChart label="Water" unit="L" missionDay={1} points={[]} />);
  expect(screen.getByText('No data yet')).toBeInTheDocument();
  expect(container.querySelector('[data-testid="trend-line"]')).toBeNull();
  expect(container.innerHTML).not.toMatch(/NaN/);
});
test('week bars show seven days and the total', () => {
  const { container } = render(<WeekBars label="Exercise" unit="h" target={1.5} values={[1.5, 1, 0.5, 1.5, 1, 0, 1]} />);
  expect(container.querySelectorAll('[data-testid="bar"]')).toHaveLength(7);
  expect(screen.getByRole('img')).toHaveAccessibleName('Exercise, 6.5 h over 7 days, target 1.5 h per day');
});
test('symptom strip marks only the reported days', () => {
  const { container } = render(<SymptomStrip label="Trouble sleeping" reportedDays={[41, 43, 45, 2]} endDay={47} />);
  expect(container.querySelectorAll('[data-testid="cell"]')).toHaveLength(30);
  expect(container.querySelectorAll('[data-testid="cell"][data-on="true"]')).toHaveLength(3);   // gün 2 pencerenin dışında
});
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/charts` · Expected: FAIL.
- [ ] **Step 3:** Üç bileşeni yaz. Çizgi ve çubuk rengi `var(--bone)`, eksen ve temel değer `var(--muted)`.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: trend, weekly and symptom-strip charts"`

### Task 10: Harita ekranı ve bölge paneli

**Files:**
- Create: `src/ui/Header.tsx`, `Checkbox.tsx`, `SourceLink.tsx`, `src/ui/map/MapScreen.tsx`, `RegionPanel.tsx`, `DaySummary.tsx`, `SystemIndex.tsx`, `map.css`
- Modify: `src/App.tsx`
- Test: `src/ui/map/MapScreen.test.tsx`

**Interfaces:**
- Consumes: `useApp`, `AppProvider`, `emptyProfile`, `streak`, `stepsDoneToday` (Task 6); `assessAll`, `expectedBoneLoss`; `BodyFigure`, `Stars`, `StatusGlyph`; grafikler; `REGIONS`, `INDICATORS`, `SYMPTOMS`, `HAZARDS`, `SOURCES`, `MISSIONS`.
- Produces: `MapScreen()`, `Header()`, `Checkbox(p: { checked: boolean; onChange(v: boolean): void; children: React.ReactNode })`, `SourceLink(p: { source: string })` (kaynağın başlığını yeni sekmede açılan bağlantı olarak yazar).

Davranış (spec 5.1, 5.2): `Header` her ekranda uygulama adını, `simulated` ise `Simulated data` etiketini, `Flight day 47 of 180`, `Check-in 3 of 5`, `Streak 12 d` satırını, görünüm düğmelerini (`Body map`, `Check-in`, `Review`, `Symptom log`, `Ground report`, `Sources`) ve `Advance one day` düğmesini gösterir. `MapScreen` solda figür (köşe yazıları: mürettebat adı, `Flight day 047 / 180`, `Baseline L-30`, sistem sayısı, işaretli sayısı), `Show organs` kutusu; sağda seçili bölge varsa `RegionPanel`, yoksa `DaySummary`; altta `SystemIndex`. `RegionPanel` başlığı bölge adı ve durum; **Findings**: her gösterge için son değer, temel değerden fark, `TrendChart`; egzersiz için `WeekBars`; Bones'ta `Expected density loss by day 47: 1.6–2.4%`; bölgenin belirtileri için `SymptomStrip`; uzun süreli bulguların `reason` metni; girilmemiş gösterge `due`. **Impression**: `impression` metinleri kaynak bağlantısıyla, tehlike adları (`Caused by: Gravity fields`) ve varsa `What it does:` etiketiyle işlev satırı. **Recommendation**: `Tick what you will do today.`, onay kutulu öneriler (her biri kaynak bağlantılı), `Add N to today's plan` düğmesi (`planAdd`); hiçbiri seçili değilken `Nothing selected` ve devre dışı. Ground-report maddesi yalnızca bölge işaretliyken listelenir; uzun süreli bulgu varsa işaretli gelir. Radiation panelinde durum yerine `Total logged dose` (kayıtlı `radiationDose` değerlerinin toplamı) gösterilir.

Arayüz test yardımcıları `src/ui/test-helpers.tsx` içinde: `demoState: AppState` (demo profili, `view: 'map'`, seçim yok, organlar kapalı) ve `todayEntry(state: AppState): DayEntry`.

- [ ] **Step 1: Başarısız testleri yaz**

```tsx
const renderMap = (initial?: Partial<AppState>) => render(<AppProvider initial={{ ...demoState, ...initial }}><Header /><MapScreen /></AppProvider>);

test('header carries the demo context on screen', () => {
  renderMap();
  for (const t of ['Simulated data', 'Flight day 47 of 180', 'Check-in 3 of 5', 'Streak 12 d']) expect(screen.getByText(t)).toBeInTheDocument();
});
test('with nothing selected the panel summarises the day', () => {
  renderMap();
  expect(screen.getByText('3 systems need attention')).toBeInTheDocument();
});
test('selecting Bones shows findings, a sourced impression and tickable recommendations', async () => {
  renderMap({ selectedRegion: 'bones' });
  expect(screen.getByRole('heading', { name: 'Bones' })).toBeInTheDocument();
  expect(screen.getByText(/Expected density loss by day 47: 1\.6–2\.4%/)).toBeInTheDocument();
  expect(screen.getByText('Caused by: Gravity fields')).toBeInTheDocument();
  expect(screen.getAllByRole('link').some(a => a.getAttribute('href') === SOURCES['risk-bone'].url)).toBe(true);
  const boxes = screen.getAllByRole('checkbox');
  await userEvent.click(boxes[0]); await userEvent.click(boxes[1]);
  expect(screen.getByRole('button', { name: "Add 2 to today's plan" })).toBeEnabled();
});
test('with no recommendation ticked the button is disabled', () => {
  renderMap({ selectedRegion: 'muscles' });
  expect(screen.getByRole('button', { name: 'Nothing selected' })).toBeDisabled();
});
test('a long-term flag explains itself and pre-ticks the ground report', () => {
  renderMap({ selectedRegion: 'brain' });
  expect(screen.getByText('Reported on 3 of the last 7 days')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Add to the next ground report/ })).toBeChecked();
});
test('a region without a sourced function line shows none', () => {
  renderMap({ selectedRegion: 'kidneys' });
  expect(screen.queryByText(/^What it does/)).toBeNull();
});
test('the system index lists all 12 and selects on click', async () => {
  renderMap();
  await userEvent.click(screen.getByRole('button', { name: /Kidneys/ }));
  expect(screen.getByRole('heading', { name: 'Kidneys' })).toBeInTheDocument();
});
test('an empty profile on day 1 renders without numbers going wrong', () => {
  const { container } = render(<AppProvider initial={{ ...demoState, profile: emptyProfile('New crew', 'station', {}), selectedRegion: 'heart' }}><Header /><MapScreen /></AppProvider>);
  expect(screen.getByText('Flight day 1 of 180')).toBeInTheDocument();
  expect(screen.getAllByText('No data yet').length).toBeGreaterThan(0);
  expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
  expect(screen.queryByText('Simulated data')).toBeNull();
});
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/map` · Expected: FAIL.
- [ ] **Step 3:** Bileşenleri yaz; `App` `AppProvider` içinde `Header` ve `state.view`'a göre ekranı gösterir (henüz yazılmamış görünümler için `MapScreen`).
- [ ] **Step 4:** Run: `npx vitest run` · Expected: bütün testler PASS.
- [ ] **Step 5: Görsel kontrol.** `npm run build`, ardından arka planda `npx vite preview --port 4173`. Ekran görüntüsü: `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 --screenshot=shot-map.png http://localhost:4173/`. Görüntü `docs/mockups/lightbox-v4.html` ile karşılaştırılır: iki sütun, figür ölçüsü, etiket yuvaları, yazı tipleri. Etiketler birbirine ya da kollara biniyorsa `CALLOUTS` düzeltilir. Ekran görüntüsü dosyaları commit edilmez.
- [ ] **Step 6:** `git add -A && git commit -m "feat: body map screen with region panel, summary and system index"`

### Task 11: Günlük kayıt

**Files:**
- Create: `src/domain/input.ts`, `src/ui/checkin/CheckIn.tsx`, `checkin.css`
- Modify: `src/App.tsx` (`view === 'checkin'`)
- Test: `src/domain/input.test.ts`, `src/ui/checkin/CheckIn.test.tsx`

**Interfaces:**
- Produces:

```ts
export function parseNumber(text: string): number | null;                         // '36,8' → 36.8; '' ve 'abc' → null
export function validateValue(id: IndicatorId, text: string): { value: number } | { error: string };
export function CheckIn(): JSX.Element;
```

Hata metinleri: boş alan atlanabilir (kayıt edilmez, hata değildir); sayı değilse `Enter a number`; aralık dışıysa `Enter a value between {min} and {max}`. Davranış (spec 5.3): beş adımlı form, sıra `DAILY_STEPS`; her alanda etiket, birim, `why.text` ve kaynak bağlantısı, `howTo`. Belirtiler adımı bölgeye göre gruplu onay kutuları, `Anything else?` serbest metin alanı (`otherDiscomfort`) içerir; uyku adımında isteğe bağlı `Journal note`. `Save and continue` hatasızsa `saveStep` gönderir ve sonraki adıma geçer; son adımdan sonra `view: 'map'`. Tamamlanmış adımlar değerleriyle açılır.

- [ ] **Step 1: Başarısız testleri yaz**

```ts
// src/domain/input.test.ts
test.each([['36,8', 36.8], ['36.8', 36.8], [' 62 ', 62], ['', null], ['abc', null], ['12abc', null], ['1,2,3', null]])('parseNumber(%j)', (t, v) => expect(parseNumber(t)).toBe(v));
test('range errors name the limits', () => expect(validateValue('heartRate', '400')).toEqual({ error: 'Enter a value between 30 and 220' }));
test('negative values are out of range', () => expect(validateValue('waterLiters', '-1')).toEqual({ error: 'Enter a value between 0 and 10' }));
```

```tsx
// src/ui/checkin/CheckIn.test.tsx
test('a comma decimal is accepted and saved', async () => {
  const { store } = renderCheckIn({ step: 'vitals' });
  await userEvent.clear(screen.getByLabelText(/Body temperature/)); await userEvent.type(screen.getByLabelText(/Body temperature/), '36,8');
  await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  expect(todayEntry(store).values.bodyTemp).toBe(36.8);
});
test('an invalid value blocks the save and explains', async () => {
  const { store } = renderCheckIn({ step: 'vitals' });
  await userEvent.clear(screen.getByLabelText(/Heart rate/)); await userEvent.type(screen.getByLabelText(/Heart rate/), '400');
  await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  expect(screen.getByText('Enter a value between 30 and 220')).toBeInTheDocument();
  expect(todayEntry(store).values.heartRate).not.toBe(400);
});
test('every field explains why it is tracked, with its source', () => { /* her alanın yanında why.text ve bir kaynak bağlantısı */ });
test('symptoms and a free-text discomfort are stored for today', async () => {
  const { store } = renderCheckIn({ step: 'symptoms' });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Headache' }));
  await userEvent.type(screen.getByLabelText('Anything else?'), 'Sore wrist');
  await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  expect(todayEntry(store)).toMatchObject({ symptoms: ['headache'], otherDiscomfort: 'Sore wrist' });
});
test('finishing the fifth step returns to the map and completes the day', async () => { /* stepsDone uzunluğu 5, view 'map' */ });
test('reopening a finished step shows what was entered', () => { /* vitals alanları bugünün değerleriyle dolu */ });
```

- [ ] **Step 2:** Run: `npx vitest run src/domain/input.test.ts src/ui/checkin` · Expected: FAIL.
- [ ] **Step 3:** İki dosyayı yaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: daily check-in with per-indicator help and input validation"`

### Task 12: Kaynaklar ekranı ve P0 kapanışı

**Files:**
- Create: `src/ui/sources/Sources.tsx`
- Modify: `src/App.tsx` (`view === 'sources'`)
- Test: `src/ui/sources/Sources.test.tsx`

**Interfaces:**
- Consumes: `SOURCES`, `THRESHOLDS`, `INDICATORS`.
- Produces: `Sources()`.

İçerik (spec 5.7): NASA ve CSA başlıkları altında bütün kaynaklar, başlık ve bağlantıyla; `Artwork` bölümü: `Skeleton drawing by Mariana Ruiz Villarreal; unlabelled edition and organ drawings by Mikael Häggström. Public domain, via Wikimedia Commons.`; `Thresholds` bölümü: `These limits are the team's own settings, not NASA values.` ve her göstergenin sınırlarını `THRESHOLDS`'tan okuyan tablo; `Simulated data` açıklaması; `Reset demo` düğmesi.

- [ ] **Step 1: Başarısız testi yaz**

```tsx
test('every source is listed with its link', () => {
  render(<AppProvider><Sources /></AppProvider>);
  Object.values(SOURCES).forEach(s => expect(screen.getByRole('link', { name: s.title })).toHaveAttribute('href', s.url));
});
test('thresholds are declared as the team\'s own', () =>
  expect(screen.getByText("These limits are the team's own settings, not NASA values.")).toBeInTheDocument());
test('artwork is credited', () => expect(screen.getByText(/Mariana Ruiz Villarreal/)).toBeInTheDocument());
test('threshold table reads from the settings', () => expect(screen.getByRole('row', { name: /Heart rate.*15%.*25%/ })).toBeInTheDocument());
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/sources` · Expected: FAIL.
- [ ] **Step 3:** `Sources`'ı yaz.
- [ ] **Step 4:** Run: `npx vitest run && npm run build` · Expected: bütün testler PASS, derleme hatasız.
- [ ] **Step 5: Çevrimdışı kontrol.** `dist/` içinde `fonts.googleapis.com` ya da başka bir dış adres geçmediği doğrulanır: `grep -r "https\?://" dist --include=*.js --include=*.css --include=*.html -oh | sort -u`. Beklenen: yalnızca içerikteki NASA, CSA ve Wikimedia bağlantıları; yazı tipi ya da betik adresi yok.
- [ ] **Step 6:** `git add -A && git commit -m "feat: sources screen with credits and threshold notice"`

**P0 burada biter.** Uygulama demo profiliyle açılır, bölgeler işaretlenir, kayıt girilir ve durum yeniden hesaplanır.

---

# P1

### Task 13: Haftalık ve aylık değerlendirme

**Files:**
- Create: `src/domain/review.ts`, `src/ui/review/Review.tsx`
- Modify: `src/ui/map/DaySummary.tsx` (duyuru), `src/App.tsx`
- Test: `src/domain/review.test.ts`, `src/ui/review/Review.test.tsx`

**Interfaces:**
- Produces:

```ts
export type Period = 'week' | 'month';                                    // 7 ve 30 gün
export function reviewDue(day: number): Period | null;                    // 30'un katı → 'month', 7'nin katı → 'week'
export interface ReviewRow { region: RegionId; symptomDays: Record<string, number>; flaggedDays: { caution: number; warning: number };
  indicators: { id: IndicatorId; mean: number | null; previousMean: number | null; baseline: number | undefined }[]; flags: Finding[]; }
export function periodReview(p: Profile, period: Period, endDay: number): ReviewRow[];   // REGION_ORDER sırasıyla
```

- [ ] **Step 1: Başarısız testleri yaz**

```ts
test.each([[7, 'week'], [14, 'week'], [30, 'month'], [210, 'month'], [47, null], [0, null]])('reviewDue(%i)', (d, r) => expect(reviewDue(d)).toBe(r));
test('weekly review counts symptom days and compares with the week before', () => {
  const row = periodReview(createDemoProfile(), 'week', 47).find(r => r.region === 'brain')!;
  expect(row.symptomDays.troubleSleeping).toBe(3);
  expect(row.flags).toContainEqual(expect.objectContaining({ label: 'recurring' }));
  expect(row.indicators.find(i => i.id === 'sleepHours')).toMatchObject({ baseline: 7.5 });
});
test('monthly review still sees the early motion-sickness cluster only inside its window', () => {
  expect(periodReview(createDemoProfile(), 'month', 30).find(r => r.region === 'innerEar')!.symptomDays.motionSickness).toBe(4);
  expect(periodReview(createDemoProfile(), 'month', 47).find(r => r.region === 'innerEar')!.symptomDays.motionSickness ?? 0).toBe(0);
});
test('flaggedDays counts each day once at its worst status', () => { /* 7 günlük pencerede caution + warning ≤ 7 */ });
```

`Review` ekranı: `Week` ve `Month` düğmeleri; bölge başına satır: belirti günleri, işaretli gün sayıları, bu dönem ve önceki dönem ortalamaları, uzun süreli etiketler. `DaySummary`, `reviewDue(missionDay)` boş değilse `Weekly review ready` ya da `Monthly review ready` düğmesi gösterir (`view: 'review'`). Ekran testi: demo profilinde hafta görünümünde `Trouble sleeping · 3 of 7 days` ve `recurring` görünür; gün 49'a ilerletilince özet `Weekly review ready` gösterir.

- [ ] **Step 2:** Run: `npx vitest run src/domain/review.test.ts src/ui/review` · Expected: FAIL.
- [ ] **Step 3:** İki dosyayı yaz, duyuruyu ekle.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: weekly and monthly review"`

### Task 14: Belirti günlüğü

**Files:**
- Create: `src/ui/log/SymptomLog.tsx`
- Modify: `src/App.tsx`
- Test: `src/ui/log/SymptomLog.test.tsx`

**Interfaces:**
- Consumes: `SYMPTOMS`, `REGIONS`, `SymptomStrip`.
- Produces: `SymptomLog()`.

Davranış (spec 5.8): bölgeye göre gruplu satırlar, her belirti için 30 günlük `SymptomStrip`; `Earlier` ve `Later` düğmeleri pencereyi 30 gün kaydırır; altında `Other discomforts` listesi (gün ve metin).

- [ ] **Step 1: Başarısız testi yaz**

```tsx
test('the log shows the last 30 days and can go back to the early cluster', async () => {
  render(<AppProvider><SymptomLog /></AppProvider>);
  expect(screen.getByRole('img', { name: /Trouble sleeping, reported on 3 of 30 days/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Motion sickness, reported on 0 of 30 days/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Earlier' }));
  expect(screen.getByRole('img', { name: /Motion sickness, reported on 4 of 30 days/ })).toBeInTheDocument();
});
test('free-text discomforts are listed with their day', () => { /* gün 47'ye 'Sore wrist' kaydedilince 'Day 47 · Sore wrist' */ });
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/log` · Expected: FAIL.
- [ ] **Step 3:** `SymptomLog`'u yaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: day-by-day symptom log"`

### Task 15: Haftalık kayıt ve iki mini test

**Files:**
- Create: `src/ui/checkin/ReactionTest.tsx`, `VisionTest.tsx`, `WeeklyCheckIn.tsx`, `src/domain/due.ts`
- Modify: `src/ui/checkin/CheckIn.tsx` (haftalık bölüme geçiş), `src/ui/map/DaySummary.tsx` (hatırlatma)
- Test: `src/ui/checkin/tests.test.tsx`, `src/domain/due.test.ts`

**Interfaces:**
- Produces:

```ts
export function dueToday(p: Profile): { dailySteps: CheckInStep[]; weekly: IndicatorId[] };   // due.ts; haftalık: son 7 günde değeri olmayanlar
export function ReactionTest(p: { trials?: number; random?: () => number; now?: () => number; onDone(medianMs: number, falseStarts: number): void }): JSX.Element;   // varsayılan 5 deneme, Math.random, performance.now
export function VisionTest(p: { random?: () => number; onDone(level: number): void }): JSX.Element;      // 8 boy; boy başına 3 soru; ok tuşları
export function WeeklyCheckIn(): JSX.Element;
```

Tepki testi: `Start`'tan sonra 1–3 saniyelik rastgele bekleme, işaret belirince boşluk ya da tıklama; işaretten önce basış "false start" sayılır ve o deneme yinelenir; sonuç ortanca milisaniye. Görme testi: `E` harfi dört yönden birinde, boy her seviyede küçülür; bir seviyede 3 sorudan 2'si doğruysa geçilir; sonuç geçilen son seviye (0–8). İki ekranda da `This is not a clinical test. It compares you with your own baseline on this screen.` yazar. Rastgelelik ve zaman, test edilebilsin diye bileşene parametre olarak verilebilir (`random`, `now`).

- [ ] **Step 1: Başarısız testleri yaz**

```tsx
test('reaction test reports the median of the trials', async () => {
  vi.useFakeTimers(); const onDone = vi.fn();
  render(<ReactionTest trials={3} random={() => 0} now={clock.now} onDone={onDone} />);
  for (const ms of [300, 250, 400]) await runTrial(ms);        // işaret çıkar, ms kadar sonra bas
  expect(onDone).toHaveBeenCalledWith(300, 0);
});
test('pressing before the signal counts as a false start and repeats the trial', async () => { /* onDone(…, 1) ve deneme sayısı değişmez */ });
test('vision test stops at the first level failed', async () => {
  const onDone = vi.fn(); render(<VisionTest random={sequence} onDone={onDone} />);
  await answerLevels({ correctUpTo: 5 });                     // 6. seviyede iki yanlış
  expect(onDone).toHaveBeenCalledWith(5);
});
test('both tests say they are not clinical', () => { /* metin iki ekranda da var */ });
test('weekly results are saved as indicators', async () => { /* saveWeekly → reactionMs, visionLevel, heightCm, strength */ });
test('weekly items are due when a week has passed without them', () => {
  expect(dueToday(profileWithWeeklyOn(40, 47)).weekly).toEqual(['strength', 'heightCm', 'reactionMs', 'visionLevel']);
  expect(dueToday(profileWithWeeklyOn(42, 47)).weekly).toEqual([]);
});
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/checkin/tests.test.tsx src/domain/due.test.ts` · Expected: FAIL.
- [ ] **Step 3:** Dosyaları yaz; `DaySummary` `dueToday` sonucunu `Due today` listesi olarak gösterir.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: weekly check-in with reaction and vision tests"`

### Task 16: Bugünün planı

**Files:**
- Create: `src/ui/map/TodayPlan.tsx`
- Modify: `src/ui/map/DaySummary.tsx`
- Test: `src/ui/map/TodayPlan.test.tsx`

**Interfaces:**
- Consumes: `planAdd`, `planToggle` eylemleri; `REGIONS` içindeki öneriler.
- Produces: `TodayPlan()`; `findRecommendation(id: string): Recommendation | undefined` (`src/content/regions.ts`).

Davranış (spec 5.4): bugünün plan maddeleri onay kutulu liste; işaretlemek `done`'ı değiştirir; plan boşsa `Nothing planned yet. Open a flagged system and tick what you will do.`; gün ilerleyince dünün planı görünmez.

- [ ] **Step 1: Başarısız testi yaz**

```tsx
test('ticked recommendations appear in today\'s plan and can be completed', async () => { /* bones'tan 2 öneri eklenir → listede 2 madde; biri işaretlenince done */ });
test('yesterday\'s plan is not shown after advancing a day', () => { /* advanceDay sonrası boş durum metni */ });
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/map/TodayPlan.test.tsx` · Expected: FAIL.
- [ ] **Step 3:** Bileşeni yaz, `DaySummary`'ye yerleştir.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: today's plan from ticked recommendations"`

### Task 17: Yer raporu

**Files:**
- Create: `src/domain/report.ts`, `src/ui/report/GroundReport.tsx`
- Modify: `src/App.tsx`
- Test: `src/domain/report.test.ts`

**Interfaces:**
- Produces: `groundReport(p: Profile, day: number): string`; `GroundReport()`.

Biçim: ilk satır `Crew health report · Crew 03 · Flight day 47 of 180 · Station`; `simulated` ise ikinci satır `SIMULATED DATA`; görevin `commsLine`'ı varsa `Comms: {commsLine}`; sonra durumu `nominal` olmayan her bölge için `[WARNING] Kidneys` başlığı ve altında her bulgunun `reason` satırı; bugün yazılmışsa `Other discomfort: ...`; son satır `{n} systems nominal.`. Ekranda metin bir `textarea` içinde salt okunur gösterilir; `Copy` (`navigator.clipboard.writeText`) ve `Download .txt` düğmeleri vardır. Gerçek gönderim yoktur.

- [ ] **Step 1: Başarısız testi yaz**

```ts
const text = groundReport(createDemoProfile(), 47);
test('report names the flagged systems with their reasons', () => {
  expect(text).toContain('[WARNING] Kidneys'); expect(text).toContain('[CAUTION] Bones'); expect(text).toContain('[CAUTION] Brain, mind & sleep');
  expect(text).toContain('Reported on 3 of the last 7 days'); expect(text).toContain('9 systems nominal.');
});
test('simulated data is declared', () => expect(text.split('\n')[1]).toBe('SIMULATED DATA'));
test('Mars adds the one-way delay from the source', () =>
  expect(groundReport({ ...createDemoProfile(), mission: 'mars' }, 47)).toContain('Comms: Up to 20 minutes one way'));
test('Moon has no comms line', () => expect(groundReport({ ...createDemoProfile(), mission: 'moon' }, 20)).not.toContain('Comms:'));
test('nothing flagged still produces a report', () => expect(groundReport(emptyProfile('A', 'station', {}), 1)).toContain('12 systems nominal.'));
```

- [ ] **Step 2:** Run: `npx vitest run src/domain/report.test.ts` · Expected: FAIL.
- [ ] **Step 3:** İki dosyayı yaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: ground report text"`

### Task 18: Görev seçimi

**Files:**
- Create: `src/ui/setup/MissionSetup.tsx`
- Modify: `src/ui/Header.tsx` (görev adı düğmesi `view: 'setup'`), `src/ui/map/RegionPanel.tsx` (öne çıkan tehlike)
- Test: `src/ui/setup/MissionSetup.test.tsx`

**Interfaces:**
- Consumes: `MISSIONS`, `setMission` eylemi.
- Produces: `MissionSetup()`.

Davranış (spec 5.6): üç seçenek; her birinde süre, iletişim satırı (Moon'da yok) ve öne çıkan tehlikeler. Seçim `mission`'ı değiştirir; `missionDay` yeni görev süresini aşıyorsa süreye çekilir. `RegionPanel`'de bölgenin tehlikesi görevin öne çıkan tehlikeleri arasındaysa `Emphasised on this mission` notu görünür.

- [ ] **Step 1: Başarısız testi yaz**

```tsx
test('choosing Mars changes the counter and shows the delay', async () => { /* 'Flight day 47 of 1095', 'Up to 20 minutes one way' */ });
test('choosing Moon clamps day 47 to 30 and shows no comms line', async () => { /* 'Flight day 30 of 30' */ });
test('Moon duration is marked as the team\'s setting', () => expect(screen.getByText(/30 days \(team setting\)/)).toBeInTheDocument());
```

- [ ] **Step 2:** Run: `npx vitest run src/ui/setup` · Expected: FAIL.
- [ ] **Step 3:** Bileşeni yaz; reducer'daki `setMission` gün sınırlamasını uygular.
- [ ] **Step 4:** Run: `npx vitest run && npm run build` · Expected: PASS, derleme hatasız.
- [ ] **Step 5:** `git add -A && git commit -m "feat: mission presets"`

**P1 burada biter.**

---

# P2

### Task 19: Kas ve lenf çizimleri

**Files:**
- Modify: `scripts/prepare-figure.mjs`, `src/figure/layout.ts`, `src/figure/generated/organs/`
- Test: `src/figure/generated.test.ts`

Eklenecek organlar (kaynak kimliği → dosya, bölge, x, y, w, h):

| Kaynak kimliği | Dosya | Bölge | x, y, w, h |
|---|---|---|---|
| image2218-4 | lymph-neck.png | immune | 170.4, 104.4, 69.1, 51.2 |
| image2339-8 | lymph-axilla.png | immune | 242.9, 183.5, 56.5, 73.4 |
| image2395-5-7 | spleen.png | immune | 219.7, 241.9, 42.3, 45.1 |
| image3428 | thigh-right.png | muscles | 128, 372, 72, 220 |
| image3428-5 | thigh-left.png | muscles | 206, 372, 72, 220 |
| image3399 | leg-right.png | muscles | 150, 590, 46, 175 |
| image3399-1 | leg-left.png | muscles | 210, 590, 46, 175 |

- [ ] **Step 1:** Teste ekle: `ORGANS` içinde `immune` ve `muscles` bölgeleri için en az birer çizim var ve dosyaları PNG.
- [ ] **Step 2:** Run: `npx vitest run src/figure/generated.test.ts` · Expected: FAIL.
- [ ] **Step 3:** Betiği ve yerleşimi güncelle, `npm run prepare-figure` çalıştır.
- [ ] **Step 4:** Aynı komut · Expected: PASS. Ardından başsız tarayıcıda `Show organs` açıkken ekran görüntüsü alınır; çizimler kemiklere oturmuyorsa koordinatlar düzeltilir.
- [ ] **Step 5:** `git add -A && git commit -m "feat: muscle and lymph artwork"`

### Task 20: Yeni profil ve temel değerler

**Files:**
- Modify: `src/ui/setup/MissionSetup.tsx`
- Test: `src/ui/setup/MissionSetup.test.tsx`

Davranış (spec 5.6): `Start a new profile` formu ad, görev ve her gösterge için temel değer ister (Task 11'deki `validateValue` ile); kaydedince `newProfile` gönderilir, `simulated: false`, gün 1. `Reset demo` her zaman demo profiline döner.

- [ ] **Step 1:** Testi yaz: form doldurulup kaydedilince başlıkta `Flight day 1 of 180` görünür, `Simulated data` görünmez, temel değerler saklanır; geçersiz temel değer kaydı engeller.
- [ ] **Step 2:** Run: `npx vitest run src/ui/setup` · Expected: FAIL.
- [ ] **Step 3:** Formu yaz.
- [ ] **Step 4:** Aynı komut · Expected: PASS.
- [ ] **Step 5:** `git add -A && git commit -m "feat: new profile with baseline entry"`

### Task 21: Cila ve yayına hazırlık

**Files:**
- Modify: `src/figure/figure.css`, `src/ui/map/map.css`, `src/styles/global.css`
- Create: `README.md`

- [ ] **Step 1: Hareket.** Taslaktaki üç hareket uygulanır: organın üzerine gelince belirginleşme (160 ms), uyarıdaki organda yavaş parlama (2,6 s), onay kutusunda işaret (140 ms). Başka animasyon eklenmez.
- [ ] **Step 2: Hareket azaltma testi.** `src/styles/reduced-motion.test.ts`: `global.css` metninde `prefers-reduced-motion: reduce` bloğunun `animation:none` ve `transition:none` içerdiği doğrulanır. Run: `npx vitest run src/styles` · Expected: PASS.
- [ ] **Step 3: Dar ekran.** 1024 piksel genişlikte ekran görüntüsü alınır; yatay kaydırma varsa iki sütun alt alta dizilir.
- [ ] **Step 4: Karşıtlık.** `--muted` ve `--text` renklerinin `--plate` ve `--bg` üzerindeki karşıtlığı hesaplanır; 4,5:1'in altındaysa renk açılır.
- [ ] **Step 5: README.** Ne olduğu, nasıl çalıştırıldığı (`npm install`, `npm run dev`, `npm test`, `npm run build`), kaynak kuralı, çizimlerin sahipleri ve lisansı, eşiklerin ekibin ayarı olduğu, demo verisinin simülasyon olduğu.
- [ ] **Step 6:** Run: `npx vitest run && npm run build` · Expected: PASS. `git add -A && git commit -m "chore: motion polish, narrow-screen layout and README"`

Yayın (hesap gerektirir, ekibe kalır): `dist/` klasörü herhangi bir statik barındırıcıya yüklenir; `base: './'` sayesinde alt klasörde de çalışır.
