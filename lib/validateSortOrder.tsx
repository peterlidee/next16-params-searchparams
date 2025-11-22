export type SortOrderT = 'asc' | 'desc';

export function validateSortOrder(
  searchParams: Awaited<PageProps<'/list/[listSlug]'>['searchParams']>
): SortOrderT {
  if ('sortOrder' in searchParams && searchParams.sortOrder === 'desc')
    return 'desc';
  return 'asc';
}
