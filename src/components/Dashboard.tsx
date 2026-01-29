'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/Supabase/supabase';
import { TimeEntry } from '@/lib/types';
import TimeTracker from './TimeTracker';
import ProgressCard from './ProgressCard';
import EntriesTable from './EntriesTable';
import BalanceCard from './BalanceCard';
import ManualEntry from './ManualEntry';
import HolidayCard from './HolidayCard';
import PrayerCard from './PrayerCard';
import WeatherCard from './WeatherCard';
import ProductivityCard from './ProductivityCard';
import QuoteCard from './QuoteCard';
import TaskList from './TaskList';
import { LogOut, User as UserIcon, LayoutDashboard, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface DashboardProps {
    user: any;
}

export default function Dashboard({ user }: DashboardProps) {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [profileStatus, setProfileStatus] = useState<'loading' | 'ok' | 'missing'>('loading');

    const fetchEntries = async () => {
        const { data } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

        if (data) setEntries(data);
    };

    const checkProfile = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data) {
            setProfileStatus('missing');
        } else {
            setProfileStatus('ok');
        }
    };

    useEffect(() => {
        fetchEntries();
        checkProfile();
    }, [user.id]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans pb-12">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-lg hidden sm:block">WorkTimer Pro</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase transition-colors">
                            <Database className="w-3 h-3" />
                            Status: {profileStatus === 'ok' ? (
                                <span className="text-green-500 flex items-center gap-1">Connected <CheckCircle className="w-3 h-3" /></span>
                            ) : profileStatus === 'missing' ? (
                                <span className="text-red-500 flex items-center gap-1">Setup Needed <AlertCircle className="w-3 h-3" /></span>
                            ) : 'Checking...'}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
                            <UserIcon className="w-4 h-4 text-zinc-500" />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{user.email}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Main Controls & Status */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TimeTracker user={user} onEntryAdded={fetchEntries} />
                            <ProgressCard entries={entries} />
                        </div>

                        <EntriesTable entries={entries} onEntryDeleted={fetchEntries} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ManualEntry user={user} onEntryAdded={fetchEntries} />
                            <TaskList />
                        </div>
                        <ProductivityCard entries={entries} />
                    </div>

                    {/* Right Column - Secondary Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <BalanceCard entries={entries} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                            <WeatherCard />
                            <QuoteCard />
                        </div>

                        <HolidayCard />
                        <PrayerCard />
                    </div>
                </div>
            </main>
        </div>
    );
}
