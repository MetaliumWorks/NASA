import { parseNumber, validateValue } from './input';

test.each([
  ['36,8', 36.8],
  ['36.8', 36.8],
  [' 62 ', 62],
  ['0', 0],
  ['-1', -1],
  ['−1', -1],
  ['+2', 2],
  ['7.', 7],
  [',5', 0.5],
  ['', null],
  ['   ', null],
  ['abc', null],
  ['12abc', null],
  ['1,2,3', null],
  ['1.2.3', null],
  ['1 000', null],
  ['1e3', null],
  ['Infinity', null],
  ['NaN', null],
  ['.', null],
  ['-', null],
])('parseNumber(%j) is %j', (text, expected) => {
  expect(parseNumber(text)).toBe(expected);
});

test('a comma decimal is a valid value', () => {
  expect(validateValue('bodyTemp', '36,8')).toEqual({ value: 36.8 });
});

test('range errors name the limits', () => {
  expect(validateValue('heartRate', '400')).toEqual({ error: 'Enter a value between 30 and 220' });
});

test('negative values are out of range', () => {
  expect(validateValue('waterLiters', '-1')).toEqual({ error: 'Enter a value between 0 and 10' });
});

test('the limits themselves are accepted', () => {
  expect(validateValue('heartRate', '30')).toEqual({ value: 30 });
  expect(validateValue('heartRate', '220')).toEqual({ value: 220 });
  expect(validateValue('mood', '5')).toEqual({ value: 5 });
});

test('text that is not a number is refused', () => {
  expect(validateValue('heartRate', 'abc')).toEqual({ error: 'Enter a number' });
  expect(validateValue('heartRate', '')).toEqual({ error: 'Enter a number' });
});
