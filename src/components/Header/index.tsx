import Link from 'next/link';

export default function Header(): JSX.Element {
  return (
    <header>
      <Link href="/">
        <a>
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
