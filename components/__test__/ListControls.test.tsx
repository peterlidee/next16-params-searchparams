import { screen, render } from '@testing-library/react';
import ListControls from '../ListControls';

import {
  useSearchParams,
  useParams,
  usePathname,
  useRouter,
} from 'next/navigation';
import { SortOrderT } from '@/lib/validateSortOrder';

jest.mock('next/navigation');

function setupRender(
  sortOrder: SortOrderT // 'asc' | 'desc'
) {
  render(<ListControls sortOrder={sortOrder} />);
}

describe('<ListControles />', () => {
  test('It renders', () => {
    render(<ListControls sortOrder={'asc'} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toEqual(2);
    expect(buttons[0]).toHaveTextContent(/ascending/i);
    expect(buttons[1]).toHaveTextContent(/descending/i);
  });
});
