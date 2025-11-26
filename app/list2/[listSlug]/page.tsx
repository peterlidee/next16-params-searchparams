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
