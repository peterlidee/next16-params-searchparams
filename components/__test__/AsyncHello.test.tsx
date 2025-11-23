import { render, screen } from '@testing-library/react';
import AsyncHello from '../AsyncHello';

async function generateAsyncValue<T>(value: T) {
  return value;
}

describe('<AsyncHello />', () => {
  test('It renders', async () => {
    const component = await AsyncHello({ name: generateAsyncValue('Peter') });
    render(component);
    expect(screen.getByText('Hello Peter')).toBeInTheDocument();
  });
});
