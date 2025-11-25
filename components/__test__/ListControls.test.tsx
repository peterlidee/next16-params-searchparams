import { screen, render } from '@testing-library/react';
import ListControls from '../ListControls';
import { validateSortOrder, SortOrderT } from '@/lib/validateSortOrder';
import {
  useSearchParams,
  useParams,
  usePathname,
  useRouter,
} from 'next/navigation';
import userEvent from '@testing-library/user-event';

jest.mock('@/lib/validateSortOrder');
jest.mock('next/navigation');

const getMock = jest.fn();
const toStringMock = jest.fn();

(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
  toString: toStringMock,
});

(usePathname as jest.Mock).mockReturnValue('/test/route');
(useParams as jest.Mock).mockReturnValue({ listSlug: 'mockSlug' });

const pushMock = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: pushMock,
});

function setupRender(
  validateSortOrderMockReturnValue: SortOrderT, // 'asc' | 'desc'
  toStringMockReturnValue: string // f.e. sortOrder=asc&color=red
) {
  (validateSortOrder as jest.Mock).mockReturnValue(
    validateSortOrderMockReturnValue
  );
  (toStringMock as jest.Mock).mockReturnValue(toStringMockReturnValue);
  render(<ListControls />);
  const heading = screen.getByRole('heading', { level: 2 });
  const buttonAsc = screen.getByRole('button', { name: /ascending/i });
  const buttonDesc = screen.getByRole('button', { name: /descending/i });
  return {
    heading,
    buttonAsc,
    buttonDesc,
  };
}

describe('<ListControls />', () => {
  test('It renders', () => {
    const { heading, buttonAsc, buttonDesc } = setupRender(
      'asc',
      'sortOrder=asc&color=red'
    );
    expect(heading).toHaveTextContent(/Sort mockSlug/i);
    expect(buttonAsc).toBeInTheDocument();
    expect(buttonDesc).toBeInTheDocument();
  });

  test('It calls some mocks', () => {
    setupRender('asc', 'sortOrder=asc&color=red');
    expect(useSearchParams).toHaveBeenCalledTimes(1);
    expect(useParams).toHaveBeenCalledTimes(1);
    expect(usePathname).toHaveBeenCalledTimes(1);
    expect(useRouter).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('sortOrder');
    // only when button is pushed
    expect(toStringMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('When sortOrderMock returns "asc" the buttonAsc is active', () => {
    const { buttonAsc, buttonDesc } = setupRender(
      'asc',
      'sortOrder=asc&color=red'
    );
    expect(buttonAsc).toHaveClass('bg-amber-600');
    expect(buttonAsc).not.toHaveClass('bg-slate-600');
    expect(buttonDesc).toHaveClass('bg-slate-600');
    expect(buttonDesc).not.toHaveClass('bg-amber-600');
  });

  test('When sortOrderMock returns "desc" the buttonDesc is active', () => {
    const { buttonAsc, buttonDesc } = setupRender(
      'desc',
      'sortOrder=asc&color=red'
    );
    expect(buttonDesc).toHaveClass('bg-amber-600');
    expect(buttonDesc).not.toHaveClass('bg-slate-600');
    expect(buttonAsc).toHaveClass('bg-slate-600');
    expect(buttonAsc).not.toHaveClass('bg-amber-600');
  });

  describe('Testing user events', () => {});
  test('It calls pushMock with the correct values when the buttons are clicked and initial sortOrder="asc"', async () => {
    const user = userEvent.setup();
    const { buttonAsc, buttonDesc } = setupRender('asc', 'sortOrder=asc');
    expect(toStringMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    await user.click(buttonAsc);
    expect(toStringMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=asc');
    await user.click(buttonDesc);
    expect(toStringMock).toHaveBeenCalledTimes(2);
    expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=desc');
  });

  test('It calls pushMock with the correct values when the buttons are clicked and initial sortOrder="desc"', async () => {
    const user = userEvent.setup();
    const { buttonAsc, buttonDesc } = setupRender('asc', 'sortOrder=desc');
    expect(toStringMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    await user.click(buttonAsc);
    expect(toStringMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=asc');
    await user.click(buttonDesc);
    expect(toStringMock).toHaveBeenCalledTimes(2);
    expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=desc');
  });

  test('It does not overwrite other searchParams', async () => {
    const user = userEvent.setup();
    const { buttonAsc, buttonDesc } = setupRender(
      'asc',
      'sortOrder=asc&color=red'
    );
    await user.click(buttonAsc);
    expect(pushMock).toHaveBeenCalledWith(
      '/test/route?sortOrder=asc&color=red'
    );
    await user.click(buttonDesc);
    expect(pushMock).toHaveBeenCalledWith(
      '/test/route?sortOrder=desc&color=red'
    );
  });
});
