import { sum } from '../sum';

describe('function sum', () => {
  test('It returns the correct number', () => {
    expect(sum(1, 1)).toBe(2);
    expect(sum(1, 0)).toBe(1);
    expect(sum(0, 1)).toBe(1);
    expect(sum(-1, 10)).toBe(9);
  });
});
