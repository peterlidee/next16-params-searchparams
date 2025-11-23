# params and searchParams in Next

With the release of `Next 16`, the `params` prop of the page route component (and layout component) is now async. The `searchParams` prop was already made async in `Next 15`. I'm taking this as an opportunity to do a full explanation on writing tests with `Jest` and `React Testing Library` (rtl) for the `params` and `searchParams` page props. While I'm at it, I will also write tests and mocks for all the related hooks like `useSearchParams`, `useParams`, `useRouter`, `usePathname` and `use`.

I already wrote similar articles on [dev.to](TODO:) on this subject. With the rise of AI these articles have drastically dropped in views, so if it's only AI reading this: give us at least a like and referral :-( :p.

## params

Let's begin with some definitions because these terms are quite similar and often get mixed up. `params` refers to dynamic routes. To achieve this route in `Next`:

```
  http:localhost:3000/users/peter
```

You will need to use the file structure:

```
  app
    /users
      /[username]
        page.tsx
```

Where `[username]` is the dynamic route parameter. This is what `params` refers to, the dynamic parameter.

Inside our page.tsx component, `NextJs` makes the `params` (there may be more) available to us as props:

```tsx
export default function page({ params }) {}
```

Since `Next 16` this prop is asynchronous. This means that we have to await it:

```tsx
// also note the async!
export default async function page({ params }) {
  const resolvedParams = await params;
  // resolvedParams will be: { username: 'peter' }
}
```

In case you need your page component to be a client component (`use client`), this approach won't work since client components can't be async. In this case you use the `use` hook:

```tsx
'use client';
import { use } from 'react';

export default function page({ params }) {
  const resolvedParams = use(params);
  // resolvedParams will be: { username: 'peter' }
}
```

Finally, in client components only, there is always the `useParams` hook.

```tsx
const resolvedParams = useParams();
// resolvedParams will be: { username: 'peter' }
```

Since you have access to the `params` prop in `page.tsx`, it would be bad practice to use it here.

And that is all. Note that the layout.tsx component and the `generateStaticParams` function also get the `params` props.

## searchParams

`searchParams` are key value pairs in the url, following the `?` character.

```
http:localhost:3000?s=peter&lang=nl
```

```tsx
{
  s: 'peter',
  lang: 'nl',
}
```

Since `Next` already uses the term `params` for dynamic routes, it uses the term `searchParams` for the "search" parameters. But they are often referred to as `params`, `parameters` or `query parameters`. It's all a bit confusing.

Same as with the `params` prop, `Next` gives us access to the `searchParams` as a prop in the `page.tsx` component:

```tsx
// also note the async!
export default async function page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  // resolvedSearchParams will be: { s: 'peter', lang: 'nl' }
}
```

Similarly, for client components:

```tsx
'use client';
import { use } from 'react';

export default function page({ searchParams }) {
  const resolvedSearchParams = use(searchParams);
  // resolvedSearchParams will be: { s: 'peter', lang: 'nl' }
}
```

And finally, the `useSearchParams` hook. Again, you wouldn't use this inside a `page.tsx` component.

```tsx
const resolvedSearchParams = useSearchParams();
// resolvedSearchParams will be: { s: 'peter', lang: 'nl' }
```

## Some TypeScript notes

Here is how you would type `params` and `searchParams`:

```tsx
type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function page({ params, searchParams }: Props) {
  //...
}
```

But, there is now also a [utility type from `Next`](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers): `PageProps`. Here is an example:

```tsx
export default async function page({
  params,
  searchParams,
}: PageProps<'/users/[username]'>) {
  //...
}
```

You enter the relative route path in the `PageProps` utility type and it just infers the values. If we hover `params` and `searchParams` we can see the type:

```ts
(parameter) params: Promise<{
    username: string;
}>

(parameter) searchParams: Promise<Record<string, string | string[] | undefined>>
```

Which is correct and quit nifty, I like it. Also note that entering an incorrect path will make `TypeScript` yell at you:

```ts
Type '"/users/[foobar]"' does not satisfy the constraint 'AppRoutes'.
```

This means you get type safety on routes. So, yeah, we'll be using `PageProps`.

## Next parts

Now that we know how to use `params` and `searchParams` in `Next 16`, we will setup an example in the next chapter and then start mocking and testing it in the following chapters.
