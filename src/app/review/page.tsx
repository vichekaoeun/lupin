import Nav from '@/components/Nav';
import ReviewClient from './ReviewClient';

export default function ReviewPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8 w-full">
        <ReviewClient />
      </main>
    </>
  );
}
