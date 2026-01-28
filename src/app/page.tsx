"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import WorkTimer from '@/components/WorkTimer';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-heading)'
      }}>
        Initializing Workspace...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--background)'
    }}>
      <WorkTimer />
    </main>
  );
}
