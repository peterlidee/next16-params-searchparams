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
