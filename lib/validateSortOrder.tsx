import { CustomPageProps } from '@/app/list/[listSlug]/page';

export type SortOrderT = 'asc' | 'desc';

export function validateSortOrder(
  searchParams: Awaited<CustomPageProps['searchParams']>
): SortOrderT {
  if ('sortOrder' in searchParams && searchParams.sortOrder === 'desc')
    return 'desc';
  return 'asc';
}
