import Nav from '@/components/Nav';
import AddWordClient from './AddWordClient';

export default function AddPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8 w-full">
        <AddWordClient />
      </main>
    </>
  );
}
