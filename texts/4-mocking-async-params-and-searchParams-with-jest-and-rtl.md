# Mocking async params and searchParams in Next 16 using Jest and React Testing Library

In the previous chapters we looked at how `params` and `searchParams` work in `Next 16`. We then went over an example that we will be testing and finally setup `Jest`. We're now all ready to start writing some actual tests. The code for this example is available on [github](https://github.com/peterlidee/next16-params-searchparams).

Our example looks like this

[insert example.png]

And consists of a `page.tsx` component, a client component `<ListControls />` for the buttons and a helper function `validateSortOrder` to validate the `searchParams`.

## validateSortOrder

Let's do this function first. This isn't relevant on this topic but the tests run different scenario's for our `searchParams` like: `{}`, `{ sortOrder: '' }`, `{ sortOrder: 'asc' }`,... So, we handled this and no longer need to test it.

Here is the function:

```tsx
export type SortOrderT = 'asc' | 'desc';

export function validateSortOrder(
  searchParams: Awaited<PageProps<'/list/[listSlug]'>['searchParams']>
): SortOrderT {
  if ('sortOrder' in searchParams && searchParams.sortOrder === 'desc')
    return 'desc';
  return 'asc';
}
```

and these are the tests:

```tsx
// claude wrote this
// all pass

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
```

## page.tsx

Next, the page component:

```tsx
// list/[listSlug]/page.tsx

export default async function ListPage({
  params,
  searchParams,
}: PageProps<'/list/[listSlug]'>) {
  const { listSlug } = await params;
  if (!(listSlug in data)) {
    return <p>Invalid param.</p>;
  }
  const searchParamsResolved = await searchParams;
  const sortOrder = validateSortOrder(searchParamsResolved);

  return (
    <div>
      <Link href='/' className='inline-block underline text-blue-400 mb-4'>
        home
      </Link>
      <h1 className='font-bold text-xl mb-2'>List of {listSlug}</h1>
      <ListControls />
      <ul>
        {data[listSlug].sort(sortCallbacks[sortOrder]).map((item) => (
          <li key={item} className='list-disc ml-3'>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Rendering async components

We immediately run into a problem. `Jest` can't handle async components. Luckily, there is an easy fix. Consider this example:

```tsx
// components/AsyncHello.tsx

// notice async
export default async function AsyncHello() {
  return <div>Hello</div>;
}
```

And we can run a test like this:

```tsx
// components/__test__/AsyncHello.test.tsx

import { render, screen } from '@testing-library/react';
import AsyncHello from '../AsyncHello';

describe('<AsyncHello />', () => {
  // note the async
  test('It renders', async () => {
    const component = await AsyncHello();
    render(component);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

1. Call the component as a function.
2. Await the component.
3. Render the result.
4. Note the async keyword in the test callback.

## How about the async parameters

While we are in a (very) simple test file, let's look into passing async props. We update the `<AsyncHello />`:

```tsx
// components/AsyncHello.tsx

type Props = {
  name: Promise<string>;
};

export default async function AsyncHello({ name }: Props) {
  const resolvedName = await name;
  return <div>Hello {resolvedName}</div>;
}
```

So, we need to render `AsyncHello` with props.name = promise. We could do something like this:

```tsx
const name = new Promise((resolve, reject) => {
  resolve('Peter');
});
const component = await AsyncHello({ name });
render(component);
```

But there is a slightly simpler way. Async functions return a promise. So if we write a little async helper function that just returns the value, we're good.

```tsx
// components/__test__/AsyncHello.test.tsx

import { render, screen } from '@testing-library/react';
import AsyncHello from '../AsyncHello';

// helper function
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
```

## Testing page.tsx

And we're good. We can now test async components and async parameters. Great, let's return to the actual component we want to test and apply what we learned.

```tsx
// app/list/[listSlug]/__test__/page.test.tsx

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
    const component = await ListPage({
      params: generateAsyncValue({ listSlug: 'fruit' }),
      searchParams: generateAsyncValue({}),
    });
    render(component);
  });
});
```

We render async and pass a promise to props.params and props.searchParams.

```tsx
const component = await ListPage({
  params: generateAsyncValue({ listSlug: 'fruit' }),
  searchParams: generateAsyncValue({}),
});
render(component);
```

Also note that we mocked `<ListControls />` and `validateSortOrder`. We mocked `<ListControls />` because it uses a lot of hooks like `useSearchParams`. Unmocked, this would crash the test. Mocking `validateSortOrder` has 2 important consequences.

Firstly, it will break the component. By mocking we removed the return value from the function and the `page.tsx` component expects this return value to be either `asc` or `desc`, not `undefined`. To fix this, we will need to return a value ('asc' or 'desc') from the `validateSortOrder` mock:

```tsx
(validateSortOrder as jest.Mock).mockReturnValue('asc');
```

The second consequence it that the async `searchParam` value that we pass into `ListPage` component becomes irrelevant. As long as it is an object, everything is fine. But since we mocked `validateSortOrder` and it's return value, there is no longer a link between what we pass into it (`searchParams`) and what it returns (`.mockReturnValue('asc')`). This is how it's supposed to be in unit tests.

## It renders

Let's fill in the "it renders" test now. We haven't written any assertions:

```tsx
// pass
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
```

We will also test our `validateSortOrder` mock:

```tsx
// pass
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
```

## Last tests

Remember from earlier, when writing a test for `validateSortOrder`, we tested for different `searchParams`. Since we now mocked this function the only tests that are left are the ones where this mock returns "asc" or "desc". Finally we also wrote a little test for an invalid `params`. Here is our full test file, all tests pass.

```tsx
// app/list/[listSlug]/page.tsx
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
```

And that is a full test for `page.tsx`. In the next chapter, we will write a test for our final component `<ListControls />`.

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).
