// claude wrote this

import { validateSortOrder } from '../validateSortOrder';

describe('function validateSortOrder', () => {
  it('should return "asc" when sortOrder is not present in searchParams', () => {
    const searchParams = {};
    const result = validateSortOrder(searchParams);
    expect(result).toBe('asc');
  });

  it('should return "desc" when sortOrder is "desc"', () => {
    const searchParams = { sortOrder: 'desc' };
    const result = validateSortOrder(searchParams);
    expect(result).toBe('desc');
  });

  it('should return "asc" when sortOrder is "asc"', () => {
    const searchParams = { sortOrder: 'asc' };
    const result = validateSortOrder(searchParams);
    expect(result).toBe('asc');
  });

  it('should return "asc" when sortOrder has invalid value', () => {
    const searchParams = { sortOrder: 'invalid' };
    const result = validateSortOrder(searchParams);
    expect(result).toBe('asc');
  });

  it('should return "asc" when sortOrder is empty string', () => {
    const searchParams = { sortOrder: '' };
    const result = validateSortOrder(searchParams);
    expect(result).toBe('asc');
  });

  it('should return "asc" when sortOrder is undefined', () => {
    const searchParams = { sortOrder: undefined };
    const result = validateSortOrder(searchParams);
    expect(result).toBe('asc');
  });

  it('should ignore other properties in searchParams', () => {
    const searchParams = {
      sortOrder: 'desc',
      otherParam: 'value',
    };
    const result = validateSortOrder(searchParams);
    expect(result).toBe('desc');
  });
});
