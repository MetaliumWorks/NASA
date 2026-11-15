import { assessAll, flagged, flaggedFirst } from './assess';
import { createDemoProfile } from './demo';

const all = assessAll(createDemoProfile(), 47);
const regions = (list: { region: string }[]) => list.map((a) => a.region);

test('flagged lists warnings before cautions', () => {
  expect(regions(flagged(all))).toEqual(['kidneys', 'brain', 'bones']);
});

test('flaggedFirst puts the systems that were asked about first, the rest by weight', () => {
  expect(regions(flaggedFirst(all, ['bones']))).toEqual(['bones', 'kidneys', 'brain']);
  expect(regions(flaggedFirst(all, ['bones', 'brain']))).toEqual(['brain', 'bones', 'kidneys']);
});

test('a system that was asked about but is nominal is not listed', () => {
  expect(regions(flaggedFirst(all, ['heart']))).toEqual(['kidneys', 'brain', 'bones']);
});

test('with nothing asked the order is by weight', () => {
  expect(regions(flaggedFirst(all, []))).toEqual(regions(flagged(all)));
});
