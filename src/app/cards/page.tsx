import Nav from '@/components/Nav';
import CardsClient from './CardsClient';

export default function CardsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <CardsClient />
      </main>
    </>
  );
}
