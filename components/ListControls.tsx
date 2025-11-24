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

  // get sortOrder from searchParams
  const rawSortOrder = searchParams.get('sortOrder'); // string | null
  // validateSortOrder expects: {[key: string]: string | string[] | undefined}
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
