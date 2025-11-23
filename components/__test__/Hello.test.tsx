import { render, screen } from '@testing-library/react';
import Hello from '../Hello';

describe('<Hello />', () => {
  test('It renders', () => {
    render(<Hello />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

// Needing following line is actually quite funny.
// eslint-disable-next-line jest/no-commented-out-tests
/*
describe('Testing the eslint-plugins', () => {
  // 1. testing eslint-plugin-jest
  // warning  Test has no assertions
  test('a', () => {});
  // warning  Test has no assertions
  // error    Test title is used multiple times in the same describe block
  test('a', () => {});

  // 2. testing eslint-plugin-jest-dom
  test('Testing eslint-plugin-jest-dom', () => {
    // error    Prefer .toHaveClass() over checking element className
    expect(screen.getByText(/hello/i).className).toBe('foobar');
  });

  // 3. testing eslint-plugin-testing-library
  test('Testing eslint-plugin-testing-library', () => {
    // Use `queryBy*` queries rather than `getBy*` for checking element is NOT present
    expect(screen.getByRole('button')).not.toBeInTheDocument();
  });
});
*/
