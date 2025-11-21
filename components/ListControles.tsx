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
