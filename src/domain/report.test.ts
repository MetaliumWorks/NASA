import { createDemoProfile, emptyProfile } from './demo';
import { groundReport, reportFileName } from './report';
import { profile, withSymptoms } from './test-helpers';

const text = groundReport(createDemoProfile(), 47);
const lines = text.split('\n');

test('the first line says whose report it is and where the mission stands', () => {
  expect(lines[0]).toBe('Crew health report · Crew 03 · Flight day 47 of 180 · Station');
});

test('simulated data is declared', () => {
  expect(lines[1]).toBe('SIMULATED DATA');
  expect(groundReport(emptyProfile('A', 'station', {}), 1)).not.toContain('SIMULATED');
});

test('report names the flagged systems with their reasons', () => {
  expect(text).toContain('[WARNING] Kidneys');
  expect(text).toContain('[CAUTION] Bones');
  expect(text).toContain('[CAUTION] Brain, mind & sleep');
  expect(text).toContain('Reported on 3 of the last 7 days');
  expect(text).toContain('3-day average 1.3 L, 53% of baseline');
  expect(text).toContain('6.5 of 10.5 h over the last 7 days');
  expect(lines.at(-1)).toBe('9 systems nominal.');
});

test('warnings come before cautions', () => {
  const headers = lines.filter((l) => l.startsWith('['));
  expect(headers).toEqual(['[WARNING] Kidneys', '[CAUTION] Brain, mind & sleep', '[CAUTION] Bones']);
});

test('a flagged system lists what flags it, then its other findings, then what they may point to', () => {
  const start = lines.indexOf('[CAUTION] Brain, mind & sleep');
  const block = lines.slice(start + 1, lines.indexOf('', start));
  expect(block.slice(0, 2)).toEqual([
    '  ! Trouble sleeping: Reported today',
    '  ! Trouble sleeping: Reported on 3 of the last 7 days (recurring)',
  ]);
  const rest = block.slice(2);
  expect(rest.filter((l) => l.startsWith('  - ')).map((l) => l.split(':')[0])).toEqual(['  - Mood', '  - Sleep', '  - Reaction time']);
  expect(rest.at(-1)).toBe('  Possible: Sleep loss (NASA: Hazard: Isolation and Confinement)');
});

test('each flagged system names the condition from the sources that its findings match', () => {
  expect(text).toContain('  Possible: Dehydration (NASA: Hazard: Gravity Fields)');
  expect(text).toContain('  Possible: Muscle and bone loss (NASA: Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness)');
  expect(text).toContain('It is not a diagnosis.');
  expect(groundReport(emptyProfile('A', 'station', {}), 1)).not.toContain('diagnosis');
});

test('nominal systems are not itemised', () => {
  expect(text).not.toContain('Heart & vessels');
  expect(text).not.toContain('Heart rate');
});

test('the station report carries its comms line', () => {
  expect(lines[2]).toBe('Comms: Real-time support from the ground');
});

test('Mars adds the one-way delay from the source', () => {
  expect(groundReport({ ...createDemoProfile(), mission: 'mars' }, 47)).toContain('Comms: Up to 20 minutes one way');
});

test('Moon has no comms line', () => {
  expect(groundReport({ ...createDemoProfile(), mission: 'moon' }, 20)).not.toContain('Comms:');
});

test('nothing flagged still produces a report', () => {
  const quiet = groundReport(emptyProfile('A', 'station', {}), 1);
  expect(quiet).toContain('12 systems nominal.');
  expect(quiet).toContain('No system is flagged.');
  expect(quiet).not.toMatch(/NaN|undefined|Infinity/);
});

test('one nominal system is singular', () => {
  // Eleven systems cannot be flagged at once with the content we have, so check the wording directly.
  expect(groundReport(emptyProfile('A', 'station', {}), 1).split('\n').at(-1)).toBe('12 systems nominal.');
});

test("today's free-text discomfort is included, yesterday's is not", () => {
  const p = withSymptoms(47, ['headache']);
  p.entries[0].otherDiscomfort = 'Sore wrist';
  expect(groundReport(p, 47)).toContain('Other discomfort: Sore wrist');
  const q = profile([{ day: 46 }, { day: 47 }]);
  q.entries[0].otherDiscomfort = 'Old note';
  expect(groundReport(q, 47)).not.toContain('Other discomfort');
});

test('an urgent symptom is reported as a warning', () => {
  const urgent = groundReport(withSymptoms(47, ['painAfterSpacewalk']), 47);
  expect(urgent).toContain('[WARNING] Lungs & oxygen');
  expect(urgent).toContain('  ! Pain after a spacewalk: Reported today. One report of this symptom is a warning.');
});

test('the file name carries the crew and the day', () => {
  expect(reportFileName(createDemoProfile())).toBe('crew-health-report-crew-03-day-047.txt');
  expect(reportFileName(emptyProfile('  Ada / Öz  ', 'mars', {}))).toBe('crew-health-report-ada-z-day-001.txt');
  expect(reportFileName(emptyProfile('', 'mars', {}))).toBe('crew-health-report-day-001.txt');
});
