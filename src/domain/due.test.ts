import { createDemoProfile, emptyProfile } from './demo';
import { dueToday } from './due';
import { profileWithWeeklyOn } from './test-helpers';

test('weekly items are due when a week has passed without them', () => {
  expect(dueToday(profileWithWeeklyOn(40, 47)).weekly).toEqual(['strength', 'heightCm', 'reactionMs', 'visionLevel']);
  expect(dueToday(profileWithWeeklyOn(42, 47)).weekly).toEqual([]);
  expect(dueToday(profileWithWeeklyOn(47, 47)).weekly).toEqual([]);
});

test('only the missing weekly items are due', () => {
  const p = profileWithWeeklyOn(40, 47);
  p.entries.push({ day: 46, values: { heightCm: 178, strength: 4 }, symptoms: [], stepsDone: [] });
  expect(dueToday(p).weekly).toEqual(['reactionMs', 'visionLevel']);
});

test('daily steps not done today are due', () => {
  expect(dueToday(createDemoProfile()).dailySteps).toEqual(['intake', 'radiation']);
  expect(dueToday(emptyProfile('A', 'station', {})).dailySteps).toEqual(['vitals', 'sleepMood', 'symptoms', 'intake', 'radiation']);
});

test('the demo has no weekly item due on day 47, and all four two days later', () => {
  const demo = createDemoProfile();
  expect(dueToday(demo).weekly).toEqual([]);
  expect(dueToday({ ...demo, missionDay: 49 }).weekly).toEqual(['strength', 'heightCm', 'reactionMs', 'visionLevel']);
});
