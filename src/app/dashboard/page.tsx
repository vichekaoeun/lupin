import Nav from '@/components/Nav';
import DashboardClient from '../DashboardClient';

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <DashboardClient />
      </main>
    </>
  );
}
