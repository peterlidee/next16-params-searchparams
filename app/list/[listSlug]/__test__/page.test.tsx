import { render, screen } from '@testing-library/react';
import ListPage from '../page';
import ListControles from '@/components/ListControles';

jest.mock('@/components/ListControles');

async function generateAsyncValue<T>(value: T) {
  return value;
}

describe('listSlug page component', () => {
  test('It renders', async () => {
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);

    expect(screen.getByRole('link')).toHaveTextContent(/home/i);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'List of fruit'
    );
    expect(ListControles).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  test('It displays "Invalid param" when the params in not in the data object', async () => {
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'foobar' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);
    expect(screen.getByText(/Invalid param./)).toBeInTheDocument();
    // none of the other elements are present
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(ListControles).toHaveBeenCalledTimes(0);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('It renders the list asc when no searchParam sortOrder is present', async () => {
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

  test('It renders the list asc when searchParam sortOrder is asc', async () => {
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({ sortOrder: 'asc' }),
    });
    render(component);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent(/apple/i);
    expect(listItems[1]).toHaveTextContent(/banana/i);
    expect(listItems[2]).toHaveTextContent(/cherry/i);
  });

  test('It renders the list asc when searchParam sortOrder is empty', async () => {
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({ sortOrder: '' }),
    });
    render(component);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent(/apple/i);
    expect(listItems[1]).toHaveTextContent(/banana/i);
    expect(listItems[2]).toHaveTextContent(/cherry/i);
  });

  test('It renders the list asc when searchParam sortOrder is multiple values', async () => {
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({ sortOrder: ['foo', 'bar'] }),
    });
    render(component);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent(/apple/i);
    expect(listItems[1]).toHaveTextContent(/banana/i);
    expect(listItems[2]).toHaveTextContent(/cherry/i);
  });

  test('It renders the list desc when searchParam sortOrder is desc', async () => {
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({ sortOrder: 'desc' }),
    });
    render(component);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems[2]).toHaveTextContent(/apple/i);
    expect(listItems[1]).toHaveTextContent(/banana/i);
    expect(listItems[0]).toHaveTextContent(/cherry/i);
  });
});
