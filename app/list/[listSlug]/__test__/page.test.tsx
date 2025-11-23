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
});
