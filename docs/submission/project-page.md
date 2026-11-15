# Project page texts (NASA Space Apps Challenge 2026)

Copy each part into the matching field of the project page. Everything must be in English.
Team: **İkiAdam**: Anıl Akyüz, İsmail Metehan Şahin · Local event: Bursa.

---

## Project Name

Crew Health

---

## High-Level Project Summary

Crew Health is a health monitor astronauts run on themselves during long missions. Each flight day starts with a
short, required check-in: vital signs, sleep and mood, symptoms, food, water and exercise, and radiation dose. The
app compares every reading with the astronaut's own pre-flight baseline and shows the result on a scan-style body map:
the organ or bone that needs attention lights up in place, yellow for caution and red for warning. Opening a system
explains what space does to it and what to do today, in sentences quoted from NASA's Human Research Program and the
Canadian Space Agency. Weekly and monthly checks catch symptoms that keep coming back and values that drift slowly,
and anything at warning is written to a simulated ground link. Far from Earth, where help can be up to 20 minutes away
one way, the crew has to notice its own health changes; Crew Health turns NASA's description of those changes into
a daily routine and a picture anyone can read at a glance.

---

## Link to Project Demo

`[link to the 7-slide deck, public, no login]`

## Link to Final Project

https://github.com/MetaliumWorks/NASA

---

## Detailed Project Description

**What it does**

- **Body map.** Twelve body systems on one scan-style figure: brain, mind and sleep; eyes; inner ear and balance;
  heart and vessels; lungs and oxygen; blood and immunity; bones; spine; muscles; digestion and nutrition; kidneys;
  and radiation for the whole body. A flagged system lights up where it is in the body. Status is always shown three
  ways at once: colour, shape (circle, triangle, square) and a word (nominal, caution, warning).
- **Daily check-in.** Five required steps. Until they are done, the other screens stay locked. Each field says what
  the measurement is, how to take it, and why NASA tracks it, with a link to the source page.
- **Status against your own baseline.** Readings are compared with the astronaut's pre-flight values. The status
  follows 3-day averages and 7-day totals so that one bad night does not raise an alarm; today's value is shown
  next to the average.
- **Long-term checks.** Weekly and monthly reviews flag a symptom that keeps coming back (3 of the last 7 days, or 10
  of the last 30), a value outside its limit on 15 or more of the last 30 days, and a value that drifts further from baseline
  week after week.
- **Critical readings.** A single reading far from baseline asks the astronaut to measure again or confirm it; a
  confirmed one is reported to the ground at once.
- **Symptom check.** At any time the astronaut can report what they notice. The app asks about the other signs of the
  conditions it may belong to and for the measurements that help tell them apart, then answers that question first.
- **Possible conditions, never a diagnosis.** Findings are matched with 17 conditions the NASA and CSA pages describe
  and named as "Possible: …" with the source sentence. When only a habit points to a condition (too little water or
  exercise), the app says "Risk: …" instead.
- **What to do.** Each system lists the countermeasures the sources give, as tick-boxes that go into today's plan.
- **Simulated ground link.** Urgent findings, confirmed critical readings, weekly and monthly reviews and missed
  check-ins become messages in a ground log, with the mission's communication delay. Nothing leaves the device.
- **Missions.** Station (180 days), Moon (30 days, the team's setting) and Mars (about three years, up to 20 minutes
  one way), each emphasising different hazards.
- **Weekly tests.** A reaction-time test and a tumbling-E vision test on screen. They are not clinical tests: they
  compare the astronaut with their own baseline.

**How it works**

The app is a web application written in TypeScript with React, built with Vite. It needs no server and no network:
data stays in the device's local storage. It also runs as a Windows program (Electron), installed or as a single
file. The health content lives in data files separate from the code. Every health sentence carries a source page and
a verbatim quote, and an automated test fails if a quote is not found word for word in the saved copy of its page.
The project has 524 automated tests (Vitest and Testing Library).

The source pages give no normal ranges or alert limits for vital signs. Every limit in the app is the team's own
setting; the app says so next to every status and lists all limits on its Sources screen.

**Benefits and goal**

On a long mission the crew carries much of the responsibility for spotting changes in themselves. Crew Health gives
them a daily routine that takes a few minutes, a picture of the whole body that reads at a glance, and advice that is
traceable to NASA's own words. Our goal was a tool an astronaut could trust because it never says more than its
sources do.

**Tools, languages and software**

TypeScript, React, Vite, Vitest, Testing Library, Electron, electron-builder, Node.js. Fonts: Instrument Sans and
Martian Mono (SIL Open Font License). All demo data is simulated and labelled as such on every screen.

---

## NASA Data

We used the NASA Human Research Program pages listed on the challenge's Resources tab and the NASA pages they link to.
They supply every health statement, condition, countermeasure and number in the app (for example: weight-bearing bones
lose 1% to 1.5% of mineral density per month; ISS crews exercise 1.5 hours per day; Mars communication delay of up to
20 minutes one way).

Resources tab:
- 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- Ongoing HRP Research in Space: https://www.nasa.gov/hrp/ongoing-hrp-research/

Hazards:
- Hazard: Space Radiation: https://www.nasa.gov/hrp/hazard-space-radiation/
- Hazard: Isolation and Confinement: https://www.nasa.gov/hrp/hazard-isolation-and-confinement/
- Hazard: Distance From Earth: https://www.nasa.gov/hrp/hazard-distance-from-earth/
- Hazard: Gravity Fields: https://www.nasa.gov/hrp/hazard-gravity-fields/
- Hazard: Hostile/Closed Environments: https://www.nasa.gov/hrp/hazard-hostile-closed-environments/

Risks:
- Risk of Behavioral Changes and Psychiatric Disorders: https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/
- Risk of Spaceflight-Induced Bone Changes: https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/
- Risk of Cardiovascular Adaptations: https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/
- Risk of Decompression Sickness: https://www.nasa.gov/reference/risk-of-decompression-sickness/
- Risk of Injury from Dynamic Loads: https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/
- Risk of Injury and Compromised Performance from Spacewalks: https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/
- Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness: https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/
- Risk of Hypoxia: https://www.nasa.gov/reference/risk-of-hypoxia/
- Risk of Altered Immune System Responses: https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/
- Risk of Host-Microorganism Interactions: https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/
- Risk of Inadequate Food and Nutrition: https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/
- Risk of Radiation-Induced Cancers: https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/
- Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS): https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
- Risk of Altered Sensorimotor and Vestibular Function: https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/
- Risk from Inadequate Sleep and Irregular Schedules: https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- Risk of Inadequate Systems Operations Support: https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/
- Risk of Inadequate Teamwork: https://www.nasa.gov/reference/risk-of-inadequate-teamwork/

Research:
- ARCHeR: https://www.nasa.gov/reference/archer/
- Artemis II Standard Measures: https://www.nasa.gov/reference/artemis-ii-standard-measures/
- B-Complex: https://www.nasa.gov/reference/b-complex/
- Brain Fluid Pressure: https://www.nasa.gov/reference/brain-fluid-pressure/
- CIPHER: https://www.nasa.gov/reference/cipher/
- Immune Biomarkers: https://www.nasa.gov/reference/immune-biomarkers/
- Simulating Manual Piloting for Moon Landings: https://www.nasa.gov/reference/simulating-manual-piloting-for-moon-landings/
- Spacecraft Occupant Protection: https://www.nasa.gov/reference/spacecraft-occupant-protection/
- Human Research Program Omics Archive: https://www.nasa.gov/reference/omics-archive/
- Spinal Fluid Biomarkers: https://www.nasa.gov/reference/spinal-fluid-biomarkers/
- Standard Measures: https://www.nasa.gov/reference/standard-measures/
- Tempus Pro: https://www.nasa.gov/reference/tempus-pro/
- Thigh Cuff: https://www.nasa.gov/reference/thigh-cuff/
- Venous Haemostasis: https://www.nasa.gov/reference/venous-haemostasis/
- Zero T2: https://www.nasa.gov/reference/zero-t2/
- Scientists Probe How Long-Term Spaceflight Alters Immunity: https://www.nasa.gov/missions/station/scientists-probe-how-long-term-spaceflight-alters-immunity/
- How Does Spaceflight Change Food Appeal?: https://www.nasa.gov/humans-in-space/how-does-spaceflight-change-food-appeal/
- Enhanced Diet May Help Astronauts Adapt to Spaceflight: https://www.nasa.gov/missions/station/enhanced-diet-may-help-astronauts-adapt-to-spaceflight/
- Can Space Gardening Help Astronauts Cope With Isolation?: https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/
- Astronauts’ Spines Under Scrutiny: https://www.nasa.gov/missions/station/astronauts-spines-under-scrutiny/

---

## Space Agency Partner Data and Other References

Canadian Space Agency (CSA), from the challenge's Resources tab and the pages it links to:
- Monitoring radiation for astronaut health: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- Why do we conduct science experiments in space?: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- How does space affect the human body? – Infographic: https://www.asc-csa.gc.ca/eng/multimedia/search/image/8056
- Radi-N2: Tracking space radiation and its risks: https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp
- MOSFET radiation monitoring system and Matroshka-R: https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp
- Little transistor records radiation levels (EVARM): https://www.asc-csa.gc.ca/eng/iss/evarm.asp

Artwork (public domain, Wikimedia Commons):
- Human skeleton, front, no labels: drawing by Mariana Ruiz Villarreal, unlabelled edition by Mikael Häggström.
  https://commons.wikimedia.org/wiki/File:Human_skeleton_front_-_no_labels.svg
- Organ drawings from "Man shadow anatomy, expanded and with DVT" by Mikael Häggström.
  https://commons.wikimedia.org/wiki/File:Man_shadow_anatomy,_expanded_and_with_DVT.svg

Software and fonts (open source):
- React, Vite, TypeScript, Vitest, Testing Library, jsdom, Electron, electron-builder, @xmldom/xmldom.
- Instrument Sans and Martian Mono (SIL Open Font License), via Fontsource.

No NASA logos, flags or other branding are used in the app or the slides.

---

## Use of Super Intelligence (SI)

`[The team decides the final wording. The draft below states what happened in our sessions.]`

Yes. We used Claude (Anthropic) as an assistant throughout the hackathon. After reading the challenge's sources, it
proposed three possible directions; we chose the clickable body map, which the challenge text itself suggests. We
decided the features and the look: a web app, the scan-style figure, the starfield, organs shown only when needed,
day-by-day symptom records with weekly and monthly checks, a required daily check-in, doctor-like follow-up questions,
critical readings and the ground link. Claude wrote most of the code and tests, drafted these texts and the slides,
and checked the app by running it. We tested the app ourselves, reported problems and asked for changes. Every health
statement in the app is a quote from the NASA and CSA pages, checked by an automated test, not generated text. The
slides carry a visible note that they were prepared with SI assistance.
