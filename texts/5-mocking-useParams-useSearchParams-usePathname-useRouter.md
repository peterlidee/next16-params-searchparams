# Mocking Next 16 useParams, useSearchParams, usePathname and useRouter in Jest

In this chapter we write a test for a component that uses router related hooks: `useParams`, `useSearchParams`, `usePathname` and `useRouter`. The code for this example is available on [github](https://github.com/peterlidee/next16-params-searchparams).

This is the component we want to test:

```tsx
// components/ListControls

'use client';

import { SortOrderT, validateSortOrder } from '@/lib/validateSortOrder';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

export default function ListControls() {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();
  const params = useParams();

  function handleSort(newSortOrder: SortOrderT) {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('sortOrder', newSortOrder);
    router.push(`${pathName}?${newSearchParams.toString()}`);
  }

  const rawSortOrder = searchParams.get('sortOrder');
  const sortOrder = validateSortOrder(
    rawSortOrder ? { sortOrder: rawSortOrder } : {}
  );

  return (
    <>
      <h2 className='font-semibold mb-1'>Sort {params.listSlug}</h2>
      <div className='flex gap-2 mb-2'>
        <button
          className={`text-white px-2 py-1 rounded cursor-pointer ${
            sortOrder === 'asc' ? 'bg-amber-600' : 'bg-slate-600'
          }`}
          onClick={() => handleSort('asc')}
        >
          ascending
        </button>
        <button
          className={`text-white px-2 py-1 rounded cursor-pointer ${
            sortOrder === 'desc' ? 'bg-amber-600' : 'bg-slate-600'
          }`}
          onClick={() => handleSort('desc')}
        >
          descending
        </button>
      </div>
    </>
  );
}
```

## Initial test setup

Let's start by doing the things we know already. This is our initial test file:

```tsx
// components/__test__/ListControls.tsx

import { screen, render } from '@testing-library/react';
import ListControls from '../ListControls';
import { validateSortOrder, SortOrderT } from '@/lib/validateSortOrder';

jest.mock('@/lib/validateSortOrder');

describe('<ListControls />', () => {
  test('It renders', () => {
    (validateSortOrder as jest.Mock).mockReturnValue('asc');
    render(<ListControls />);
    // assertions here
  });
});
```

Note how we already mocked `validateSortOrder` and also added a return value to this mock.

## setup render function

Because this will be a quite complex setup we're going to create a setup function that will be responsible for calling the `jest render` and all of the mocks. We can then call this function in each test instead of constantly repeating ourselves. We update our testfile like this:

```tsx
// ... imports

jest.mock('@/lib/validateSortOrder');

function setupRender(
  validateSortOrderMockReturnValue: SortOrderT // 'asc' | 'desc'
) {
  (validateSortOrder as jest.Mock).mockReturnValue(
    validateSortOrderMockReturnValue
  );
  render(<ListControls />);
}

describe('<ListControls />', () => {
  test('It renders', () => {
    setupRender('asc');
    // assertions here
  });
});
```

We can take this even a step further. In our tests, we will constantly be testing our dom elements. So, we will include those in this setup function:

```tsx
function setupRender(
  validateSortOrderMockReturnValue: SortOrderT // 'asc' | 'desc'
) {
  (validateSortOrder as jest.Mock).mockReturnValue(
    validateSortOrderMockReturnValue
  );
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
```

We can then retrieve our elements like this:

```tsx
const { heading, buttonAsc, buttonDesc } = setupRender('asc');
```

## next/navigation

If we try running this test as it stands now, the test will just crash. When mounting a component with `React Testing Library`, there is no `React router`. This means that all the router related hooks will fail. That is the first issue we need to deal with.

We will first mock all the hooks that we use from `next/navigation`:

```tsx
import {
  useSearchParams,
  useParams,
  usePathname,
  useRouter,
} from 'next/navigation';

jest.mock('next/navigation');
```

This is good because it will no longer try to reach the actual router but it will call the mocks. But, we still get errors.

## mocking useSearchParams

When we try to mount `<ListControls />` in the current setup we will get this error:

```
TypeError: Cannot read properties of undefined (reading 'get')
```

This error is cause by this line in `<ListControls />`:

```tsx
const searchParams = useSearchParams();
// ...
const rawSortOrder = searchParams.get('sortOrder');
```

Quick recap, `useSearchParams` returns a `ReadonlyURLSearchParams` interface. But since we mocked the `useSearchParams()` hook, it now returns `undefined`. This means we are trying to read `.get` on `undefined` and that is what the error is telling us.

To solve this, we need to return some values from our `useSearchParams` mock: a `get` (and `toString`) property. This is how we do that:

```tsx
(useSearchParams as jest.Mock).mockReturnValue({
  get: () => {},
  toString: () => {},
});
```

But this leaves us with another problem. This is some code from our `<ListControls />` component:

```tsx
const rawSortOrder = searchParams.get('sortOrder');
const sortOrder = validateSortOrder(
  rawSortOrder ? { sortOrder: rawSortOrder } : {}
);
```

In our mocked test, `rawSortOrder` will now equal `undefined`. We mocked `validateSortOrder` so it doesn't matter what we call it with. But, maybe, we do want to validate that the `get` method was called. Maybe.

How do we do that?

```tsx
expect(useSearchParams).toHaveBeenCalled();
```

is a test for this:

```tsx
const searchParams = useSearchParams();
```

This won't work:

```tsx
// error
expect(useSearchParams.get).toHaveBeenCalled();
```

The solution here is to write a new `jest mock` function and pass that as value for the `get` property.

```tsx
const getMock = jest.fn();

(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
  toString: () => {},
});
```

And then we can write this assertion:

```tsx
// pass
expect(useSearchParams).toHaveBeenCalled();
expect(getMock).toHaveBeenCalledWith('sortOrder');
```

We could mock a return value from `getMock` but that would be pointless since we also mocked `validateSortOrder`. But, we have to do that for the `toString` method. This is the code from our `<ListControls />` component:

```tsx
const searchParams = useSearchParams();
const pathName = usePathname();
const router = useRouter();
const params = useParams();

function handleSort(newSortOrder: SortOrderT) {
  const newSearchParams = new URLSearchParams(searchParams.toString());
  newSearchParams.set('sortOrder', newSortOrder);
  router.push(`${pathName}?${newSearchParams.toString()}`);
}
//...
```

As you can see, we need this part: `searchParams.toString()`. So, we just repeat what we did earlier and make a toStringMock.

```tsx
const getMock = jest.fn();
const toStringMock = jest.fn();

(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
  toString: toStringMock,
});
```

There is something that might confuse you here. We create a new URLSearchParams and then use the `set` method on this. Shouldn't we mock this?

No! This is core javascript and we don't need to test that. We mocked `useSearchParams` because it doesn't work in `React Testing Library`. But directly calling `new URLSearchParams` works just fine.

Back to our `toString` mock. We do need a return value from this mock to perform some tests. We want tests with different return values, so we'll update our `setupRender` helper function:

```tsx
function setupRender(
  validateSortOrderMockReturnValue: SortOrderT, // 'asc' | 'desc'
  toStringMockReturnValue: string // f.e. 'sortOrder=asc&color=red'
) {
  (validateSortOrder as jest.Mock).mockReturnValue(
    validateSortOrderMockReturnValue
  );
  // add return value
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
```

Can we actually run a test now? No, it still breaks. Also, we don't have assertions yet.

## More mocks

We already mocked all of our hooks:

```tsx
import {
  useSearchParams,
  useParams,
  usePathname,
  useRouter,
} from 'next/navigation';

jest.mock('next/navigation');
```

But we need to add some more return values to these mocks. `usePathname` and `useParams` are easy. We just hardcode a return value on them:

```tsx
(usePathname as jest.Mock).mockReturnValue('/test/route');
(useParams as jest.Mock).mockReturnValue({ listSlug: 'mockSlug' });
```

`useRouter` is a bit more tricky because we use the `push` method on it. Also, we would like to know it was called. Luckily, we already know how to do this:

```tsx
const pushMock = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: pushMock,
});
```

## Testing the setup

This is the current state of our testfile:

```tsx
// components/__test__/ListControls.test.tsx

import { screen, render } from '@testing-library/react';
import ListControls from '../ListControls';
import { validateSortOrder, SortOrderT } from '@/lib/validateSortOrder';
import {
  useSearchParams,
  useParams,
  usePathname,
  useRouter,
} from 'next/navigation';

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
      'sortOrder=asc'
    );
    // assertions here
  });
});
```

And it works, the setup doesn't error. Now it's time to start writing assertions.

## It renders

```tsx
// passes
test('It renders', () => {
  const { heading, buttonAsc, buttonDesc } = setupRender(
    'asc',
    'sortOrder=asc'
  );
  expect(heading).toHaveTextContent(/Sort mockSlug/i);
  expect(buttonAsc).toBeInTheDocument();
  expect(buttonDesc).toBeInTheDocument();
});
```

## It calls some mocks

```tsx
// passes
test('It calls some mocks', () => {
  setupRender('asc', 'sortOrder=asc');
  expect(useSearchParams).toHaveBeenCalledTimes(1);
  expect(useParams).toHaveBeenCalledTimes(1);
  expect(usePathname).toHaveBeenCalledTimes(1);
  expect(useRouter).toHaveBeenCalledTimes(1);
  expect(getMock).toHaveBeenCalledWith('sortOrder');
  // only when button is pushed
  expect(toStringMock).not.toHaveBeenCalled();
  expect(pushMock).not.toHaveBeenCalled();
});
```

## It renders the buttons with the correct class

```tsx
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
```

## user events

To test that our buttons actually work, we need to edit our setup. We add the user-event package:

```
npm i -D @testing-library/user-event
```

and import it into our test file:

```tsx
import userEvent from '@testing-library/user-event';
```

## Testing buttons clicks

```tsx
describe('Testing user events', () => {});
test('It calls pushMock with the correct values when the buttons are clicked and initial sortOrder="asc"', async () => {
  const user = userEvent.setup();
  const { buttonAsc, buttonDesc } = setupRender('asc', 'sortOrder=asc');
  expect(toStringMock).not.toHaveBeenCalled();
  expect(pushMock).not.toHaveBeenCalled();
  await user.click(buttonAsc);
  expect(toStringMock).toHaveBeenCalled();
  expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=asc');
});
```

The last assertion is where all our work comes together and it is a complex thing to run in your head.

- We called `handleSort` with param 'asc' by clicking the button.
- `handleSort` runs and creates `newSearchParams`.
- In our `setupRender` function in the test file, we set a return value to `toString`: 'sortOrder=asc'. So, we expect `newSearchParams` to have this value (but we can't test this).
- We overwrite `sortOrder` to 'asc'. So it stays the same.
- We push router (we test this) with the value:
- `pathName`: we mocked this to be '/test/route'.
- `newSearchParams.toString()` which we expect to be 'sortOrder=asc'.

```tsx
// passes
expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=asc');
```

If you're feeling a bit overwhelmed by this, that is fine. You need to be very familiar with `<ListControls />` and also need to be very focused to fully understand this. Right now, I had to spend several minutes to evaluate if calling `setupRender('desc', ...)` was necessary (it's not).

Quick note, we're not actually changing the route here (and we can't). So testing if the button classes 'updated' would be pointless ... because they don't change.

We're mostly done. Inside this same test, we need to check a click on buttonDesc.

```tsx
await user.click(buttonDesc);
expect(toStringMock).toHaveBeenCalledTimes(2);
expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=desc');
```

Finally, we need 2 more tests. One with the return value for `toStringMock` set to `sortOrder=desc` and then one with an extra `searchParam` to check it didn't get overwritten.

```tsx
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
  expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=asc&color=red');
  await user.click(buttonDesc);
  expect(pushMock).toHaveBeenCalledWith('/test/route?sortOrder=desc&color=red');
});
```

All tests pass. Great. But there is one tiny little case we haven't tested. Using the `use` hook in client components.

## use hook

Quick reminder. Client components cannot be async. If we have a page route component `page.tsx` that is a client component and we want to read the _async_ `params` or `searchParams` page props on these, we need to use the `use` hook.

Here is an example (as simple as possible):

```tsx
// app/list2/[listSlug]/page.tsx

'use client';

import { use } from 'react';

export default function SyncUsePage({
  params,
  searchParams,
}: PageProps<'/list/[listSlug]'>) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  return (
    <div>
      <h2>SyncUsePage</h2>
      <div data-testid='params'>{resolvedParams.listSlug}</div>
      <div data-testid='searchParams'>{resolvedSearchParams.sortOrder}</div>
    </div>
  );
}
```

So, it's a page component, a client component and it receives `params` (listSlug) and `searchParams` (sortOrder) that we print so we can test them. How do we test this?

Well, at this point I started writing the test and discovered it can't be done. A page route that receives async parameters, that' a `Next` thing, not a `React` thing and `React Testing Library` can't handle it. It just keeps throwing errors about async this, act() that. I can't make it work. (nor could any AI)

## Conclusion

Since `Next 16`, both the `params` and `searchParams` are async. This means you have to await them and when writing tests, you need to mock them as a promise. Easy.

All the router related hooks like `useSearchParams`, `useParams`, `usePathname` and `useRouter` itself, are very handy but can be quite tricky in tests. The solution is to return objects from these mocked hooks, containing the properties you need. And to keep your focus.

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).
