import WorkTimer from '@/components/WorkTimer';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--background)'
    }}>
      <WorkTimer />
    </main>
  );
}
