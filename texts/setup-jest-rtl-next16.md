# Setting up Jest, jest-dom, React Testing Library + linting for Next 16

Before we start with writing tests and mocks we first need to setup Jest and React Testing library. This is actually quite easy but there are some little problems we need to solve and some optimizations we can make. Therefore we will devote an entire chapter on this.

## Next instruction

For our first step we will just follow the [instructions](https://nextjs.org/docs/app/guides/testing/jest#manual-setup) `Next` provides. Note, this is the `TypeScript` setup.

Install following packages as dev dependencies:

```
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

Create a `Jest` config file:

```tsx
// jest.config.ts

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  //setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
```

While we are here, we uncomment the line: `//setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],` and create a file: `jest.setup.ts`:

```tsx
import '@testing-library/jest-dom';
```

This will automatically load `jest-dom` in each test file so we don't have to manually import it each time.

`Module Path Aliases` in `Next` is what makes "pseudo absolute" (I made this name up) imports possibles. By this I mean being able to do this:

```tsx
import List from '@/components/List';
```

instead of this:

```tsx
import List from '../../../components/List';
```

This is great, it makes your project much cleaner. But, `Jest` needs to be configured to understand these aliases. In our `jest.config.ts` file, we add this rule to the config object:

```tsx
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
},
```

If you have a custom config you will have to copy it from your `tsconfig.json` file.

Finally, we add some scripts to our `package.json`:

```
  "test": "jest",
  "test:watch": "jest --watch"
```

This concludes the setup `Next` describes.

## First tests

We will be tweaking this setup a bit but first let's test it out. We write a function `sum` and a test file `sum.test.ts`:

```ts
// lib/sum.ts

export function sum(a: number, b: number) {
  return a + b;
}
```

```ts
// lib/__test__/sum.test.ts
import { sum } from '../sum';

describe('function sum', () => {
  test('It returns the correct number', () => {
    expect(sum(1, 1)).toBe(2);
    expect(sum(1, 0)).toBe(1);
    expect(sum(0, 1)).toBe(1);
    expect(sum(-1, 10)).toBe(9);
  });
});
```

Run `npm test` and the test passes, great. Next a simple `React` component and a test file:

```tsx
// components/Hello.tsx

export default function Hello() {
  return <div>Hello</div>;
}
```

```tsx
// components/__test__/Hello.test.tsx

import { render, screen } from '@testing-library/react';
import Hello from '../Hello';

describe('<Hello />', () => {
  test('It renders', () => {
    render(<Hello />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

Run the test and everything passes. Note how `.toBeInTheDocument()` is `jest-dom`, so we've proven that this gets correctly imported. Great.

## Clear mocks

In the `jest.config.ts`, we add the line: `clearMocks: true`. This will clear the mocks after each test. Saving us the effort to manually clear them each time. This is our final `jest.config.ts`:

```ts
// jest.config.ts

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Map @/ to ./
  },
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
```

## Linting

As a final step, we will add linting for `Jest`, `jest-dom` and `React Testing Library`.

Let's add the eslint plugins for these libraries:

```
npm i -D eslint-plugin-jest eslint-plugin-jest-dom eslint-plugin-testing-library
```

Now that we have the rules, we need to decide which rules we actually want to use. For each of these we use the recommended configurations. For this we need to edit the eslint config. New in `Next 16` is that it now uses the `eslint flat config`.

```tsx
// eslint.config.mjs

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
// import plugins
import jestPlugin from 'eslint-plugin-jest';
import jestDomPlugin from 'eslint-plugin-jest-dom';
import testingLibraryPlugin from 'eslint-plugin-testing-library';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // setup
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    ...jestPlugin.configs['flat/recommended'],
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    ...jestDomPlugin.configs['flat/recommended'],
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    ...testingLibraryPlugin.configs['flat/react'],
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
```

We imported the 3 plugins and then per plugin, we added a config object. By spreading the .config we immediately set a number of properties. Very handy. Read the docs to learn more.

## Testing the plugins

Reading the docs and copy pasting a lot of rules **obviously** doesn't mean they work, so let's test them.

In our `Hello.test.tsx` from earlier we're going to intentionally write some rules that should cause linting errors and warnings. I added a new describe block and added all linting warnings and errors as comments:

```tsx
// components/__test__/Hello.test.tsx

describe('Testing the eslint-plugins', () => {
  // 1. testing eslint-plugin-jest

  // warning  Test has no assertions
  test('a', () => {});
  // warning  Test has no assertions
  // error    Test title is used multiple times in the same describe block
  test('a', () => {});

  // 2. testing eslint-plugin-jest-dom

  test('Testing eslint-plugin-jest-dom', () => {
    // error    Prefer .toHaveClass() over checking element className
    expect(screen.getByText(/hello/i).className).toBe('foobar');
  });

  // 3. testing eslint-plugin-testing-library

  test('Testing eslint-plugin-testing-library', () => {
    // Use `queryBy*` queries rather than `getBy*` for checking element is NOT present
    expect(screen.getByRole('button')).not.toBeInTheDocument();
  });
});
```

Having this rule in your file should give you 5 squigglies. Running eslint confirms that each plugin found problems:

```
  14:3   warning  Test has no assertions                                                           jest/expect-expect
  17:3   warning  Test has no assertions                                                           jest/expect-expect
  17:8   error    Test title is used multiple times in the same describe block                     jest/no-identical-title
  22:50  error    Prefer .toHaveClass() over checking element className                            jest-dom/prefer-to-have-class
  28:19  error    Use `queryBy*` queries rather than `getBy*` for checking element is NOT present  testing-library/prefer-presence-queries

  ✖ 5 problems (3 errors, 2 warnings)
```

Great. Everything is now setup and we can start writing the actual tests for our glorious example app which we will do in the next chapter.
