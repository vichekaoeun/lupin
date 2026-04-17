import Nav from '@/components/Nav';
import CardDetailClient from './CardDetailClient';

export default function CardDetailPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8 w-full">
        <CardDetailClient />
      </main>
    </>
  );
}
