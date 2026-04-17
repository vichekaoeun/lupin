import Nav from '@/components/Nav';
import SettingsClient from './SettingsClient';

export default function SettingsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <SettingsClient />
      </main>
    </>
  );
}
