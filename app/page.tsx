import Link from 'next/link';

export default function Home() {
  return (
    <ul>
      <li>
        <Link href='/list/fruit' className='text-blue-400 underline'>
          /list/fruit
        </Link>
      </li>
      <li>
        <Link href='/list/names' className='text-blue-400 underline'>
          /list/names
        </Link>
      </li>
      <li>
        <Link
          href='/list2/fruit?sortOrder=asc'
          className='text-blue-400 underline'
        >
          /list2/fruit?sortOrder=asc (route page is client component)
        </Link>
      </li>
    </ul>
  );
}
