# Mocking async params and searchParams in Next 16 using Jest and React Testing Library

In the previous chapters we looked at how `params` and `searchParams` work in `Next 16`. We then went over an example that we will be testing and finally setup `Jest`. We're now all ready to start writing some actual tests.

Our example looks like this

[insert example.png]

And consists of a `page.tsx` component, a client component `<ListControles />` for the buttons and a helper function `validateSortOrder` to validate the `searchParams`.

We start of with the page component:

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
      <ListControles sortOrder={sortOrder} />
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

Note that we mocked `<ListControles />` because that uses a lot of hooks like `useSearchParams`. Unmocked, this would crash the test. Also note that we will not mock `validateSortOrder` because we want to keep this test as simple as possible. In a real world test we would.

Let's finish up this 'it renders' test. It has a link, a heading (already tested), a mocked component and a list of components. We write some more assertions.

```tsx
// all pass
expect(screen.getByRole('link')).toHaveTextContent(/home/i);
expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
  'List of fruit'
);
expect(ListControles).toHaveBeenCalledTimes(1);
expect(screen.getByRole('list')).toBeInTheDocument();
```

Finally, we can write some more tests to check the `searchParam` sortOrder. We check different scenarios:

```
// searchParams
{}
{ sortOrder: '' }
{ sortOrder: 'asc' }
{ sortOrder: 'desc' }
{ sortOrder: ['foo', 'bar'] }
```

I am just going to display the entire test file below. it should be clear. All tests pass.

```tsx
// app/list/[listSlug]/page.tsx

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
```

And that is a full test for `page.tsx` (except `validateSortOrder`). In the next chapter, we will write a test for our final component `<ListControles />`.

// TODO: spellcheck, todos, paypall link
