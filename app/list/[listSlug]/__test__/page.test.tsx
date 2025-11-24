import { render, screen } from '@testing-library/react';
import ListPage from '../page';
import ListControls from '@/components/ListControls';
import { validateSortOrder } from '@/lib/validateSortOrder';

jest.mock('@/components/ListControls');
jest.mock('@/lib/validateSortOrder');

async function generateAsyncValue<T>(value: T) {
  return value;
}

describe('listSlug page component', () => {
  test('It renders', async () => {
    (validateSortOrder as jest.Mock).mockReturnValue('asc');
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);

    expect(screen.getByRole('link')).toHaveTextContent(/home/i);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'List of fruit'
    );
    expect(ListControls).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  test('It correctly calls the validateSortOrder mock', async () => {
    (validateSortOrder as jest.Mock).mockReturnValue('asc');
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({ foo: 'bar' }),
    });
    render(component);

    expect(validateSortOrder).toHaveBeenCalledTimes(1);
    expect(validateSortOrder).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('It correctly handles invalid params', async () => {
    (validateSortOrder as jest.Mock).mockReturnValue('asc');
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'foobar' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);
    expect(screen.getByText(/Invalid param./)).toBeInTheDocument();
    // none of the other elements are present
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(ListControls).toHaveBeenCalledTimes(0);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('It renders the list asc when validateSortOrder mock returns "asc"', async () => {
    (validateSortOrder as jest.Mock).mockReturnValue('asc');
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent(/apple/i);
    expect(listItems[1]).toHaveTextContent(/banana/i);
    expect(listItems[2]).toHaveTextContent(/cherry/i);
  });

  test('It renders the list desc when validateSortOrder mock returns "desc"', async () => {
    (validateSortOrder as jest.Mock).mockReturnValue('desc');
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent(/cherry/i);
    expect(listItems[1]).toHaveTextContent(/banana/i);
    expect(listItems[2]).toHaveTextContent(/apple/i);
  });
});
