# An example of using params and searchParams in Next 16

Our goal is to write tests and mocks for `params`, `searchParams` and some other hooks. Therefore we need something to test. That is what we will be doing in this chapter. Here is what we will build:

[insert example.png]

Glorious yes? The code for this example is available on [github](https://github.com/peterlidee/next16-params-searchparams).

## Route

We start by adding a route: `app/list/[listSlug]/page.tsx`. This will give access to a `param` (`listSlug`) that we can use for testing.

```tsx
import Link from 'next/link';

export default async function ListPage({
  params,
}: PageProps<'/list/[listSlug]'>) {
  const { listSlug } = await params;

  return (
    <div>
      <Link href='/' className='inline-block underline text-blue-400 mb-4'>
        home
      </Link>
      <h1 className='font-bold text-xl mb-2'>List of {listSlug}</h1>
    </div>
  );
}
```

This should be clear. We just accessed the `params` props and then destructure it into `listSlug` variable.

## Data

To keep thing simple, I added this data object:

```tsx
const data: Record<string, string[]> = {
  fruit: ['apple', 'banana', 'cherry'],
  names: ['Adam', 'Bob', 'Cole'],
};
```

We will use `params` to access this object. So `http:localhost:3000/list/fruit` will give us the `listSlug` "fruit" and we can then render a list:

```tsx
<ul>
  {data[listSlug].map((item) => (
    <li key={item} className='list-disc ml-3'>
      {item}
    </li>
  ))}
</ul>
```

To guard against non existing slugs, we add this line:

```tsx
const { listSlug } = await params;
if (!(listSlug in data)) {
  return <p>Invalid param.</p>;
}
```

## searchParams

To make our glorious app interactive, we will use 2 buttons that will push a route with a sort parameter: `/list/fruit?sortOrder=asc` or `/list/fruit/sortOrder=desc`. In our page component, we check for the `sortOrder` `searchParam` and sort the list accordingly. So, we will destructure `searchParams` from our page props and then read the value.

```tsx
const searchParamsResolved = await searchParams;
const sortOrder = validateSortOrder(searchParamsResolved);
```

`validateSortorder` is a little helper function I wrote because we have to take all cases into account:

- no sortOrder param `http:localhost:3000/list/fruit`
- invalid sortOrder param `http:localhost:3000/list/fruit?sortOrder=foobar`
- valid sortOrder param `http:localhost:3000/list/fruit?sortOrder=desc`

The function just checks if there is a property `sortOrder` AND if said property equals 'desc'. In all other cases it returns the default 'asc'.

```tsx
// lib/validateSortOrder.tsx

export type SortOrderT = 'asc' | 'desc';

export function validateSortOrder(
  searchParams: Awaited<PageProps<'/list/[listSlug]'>['searchParams']>
): SortOrderT {
  if ('sortOrder' in searchParams && searchParams.sortOrder === 'desc')
    return 'desc';
  return 'asc';
}
```

## Sorting

Now that we have a `sortOrder`, we apply it to the list.

```tsx
const sortCallbacks = {
  asc: (a: string, b: string) => (a > b ? 1 : -1),
  desc: (a: string, b: string) => (a > b ? -1 : 1),
};

//...

<ul>
  {data[listSlug].sort(sortCallbacks[sortOrder]).map((item) => (
    <li key={item} className='list-disc ml-3'>
      {item}
    </li>
  ))}
</ul>;
```

(We put the callbacks in a seperate object to make it a bit more clean.)

## `<SortControles />` component

The only thing missing now are the buttons. Since they are buttons we need to put them inside a client component `<SortControles />`.

We are going to use the buttons to push a new route to the router. So on clicking the button 'descending' we want to do this:

```tsx
router.push('/list/fruit?sortOrder=desc');
```

We could more or less hardcode this route but that would cause a small problem. If more `searchParams` were present, they would be deleted. So if we're on this route: `http:localhost:3000/list/fruit?sortOrder=asc&foo=bar` and we push the above route, we would lose the `searchParam` `foo=bar`.

## useSeachParams

To solve this, we first use the `useSeachParams` hook that returns a readonly `URLSearchParams` interface: `ReadonlyURLSearchParams`.

> The URLSearchParams interface defines utility methods to work with the query string of a URL.
>
> source: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

These utility methods includes things like: `has()`, `get()` and `set()`. So, for example, on url `/list/fruit?foo=bar`, we can do this:

```tsx
const searchParams = useSearchParams();

searchParams.has('foo'); // true
searchParams.has('mooooo'); // false
searchParams.get('foo'); // 'bar'
searchParams.get('mooooo'); // null
```

But, in this case, we can't use `.set`. Why not? Because the `useSearchParams()` hook returns a readonly `ReadonlyURLSearchParams` interface.

```tsx
searchParams.set('foo', bar); // Unhandled Runtime Error (crash)
```

It's readonly, we can't write it. So we first need to convert it to a `URLSearchParams` interface that will allow us to write:

```tsx
// ReadonlyURLSearchParams
const searchParams = useSearchParams();
const pathName = usePathname();
const router = useRouter();

function handleSort(newSortOrder: SortOrderT) {
  // create new URLSearchParams and pass it ReadonlyURLSearchParams
  // note the .toString()
  const newSearchParams = new URLSearchParams(searchParams.toString());
  // overwrite sortOrder with new value
  // other query params are passed
  newSearchParams.set('sortOrder', newSortOrder);
  // push to router
  // usePathname() returns current path: /list/fruit
  router.push(`${pathName}?${newSearchParams.toString()}`);
}
```

Let me quickly recap this. We do not want to overwrite unrelated search parameters. So we first retrieve all `searchParams` and then just overwrite `sortOrder`. The method of doing this is a bit complex with the `ReadonlyURLSearchParams` that needs to be converted. Lastly, we construct a new url and push it to router.

Here is our full `<ListControles />` component. Apart from the code just above it's just a title and 2 buttons.

```tsx
// components/ListControles.tsx

'use client';

import { SortOrderT } from '@/lib/validateSortOrder';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

type Props = {
  sortOrder: SortOrderT;
};

export default function ListControles({ sortOrder }: Props) {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();
  const params = useParams();

  function handleSort(newSortOrder: SortOrderT) {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('sortOrder', newSortOrder);
    router.push(`${pathName}?${newParams.toString()}`);
  }
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

Quick sidenote: notice that we could've simply passed `params` and `searchParams` from `page.tsx` to `<ListControles />`. But, in a real world scenario that would include a lot of prop drilling and this also gives us a chance to use and later test and mock `useParams` (we used it in the h2 title) and `useSearchParams`.

Here is our final `page.tsx` component:

```tsx
// app/list/[listSlug]/page.tsx
import ListControles from '@/components/ListControles';
import { validateSortOrder } from '@/lib/validateSortOrder';
import Link from 'next/link';

const data: Record<string, string[]> = {
  fruit: ['apple', 'banana', 'cherry'],
  names: ['Adam', 'Bob', 'Cole'],
};

const sortCallbacks = {
  asc: (a: string, b: string) => (a > b ? 1 : -1),
  desc: (a: string, b: string) => (a > b ? -1 : 1),
};

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

Note how much code we needed to do this. Anyway, in the next chapter we will setup `Jest`, `React Testing Library` and `eslint` for these libraries.
