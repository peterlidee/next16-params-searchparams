import { render, screen } from '@testing-library/react';
import Hello from '../Hello';

describe('<Hello />', () => {
  test('It renders', () => {
    render(<Hello />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
