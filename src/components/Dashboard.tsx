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
import AyahCard from './AyahCard';
import TaskList from './TaskList';
import { LogOut, User as UserIcon, LayoutDashboard, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomHoliday } from './HolidayCard';

interface DashboardProps {
    user: any;
}

export default function Dashboard({ user }: DashboardProps) {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
    const [profileStatus, setProfileStatus] = useState<'loading' | 'ok' | 'missing'>('loading');

    const fetchHolidays = () => {
        const saved = localStorage.getItem('custom_holidays');
        if (saved) {
            try {
                setCustomHolidays(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse holidays", e);
            }
        } else {
            setCustomHolidays([]);
        }
    };

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
        fetchHolidays();
    }, [user.id]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20 selection:bg-indigo-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--card-border)]">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-extrabold text-xl tracking-tight hidden sm:block">WorkTimer Pro</h1>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none hidden sm:block">Advanced Operations</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[10px] font-black uppercase transition-all hover:border-indigo-500/50">
                            <div className={`w-2 h-2 rounded-full ${profileStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-zinc-500 dark:text-zinc-400">DB Status:</span>
                            {profileStatus === 'ok' ? (
                                <span className="text-emerald-500 tracking-wider">Operational</span>
                            ) : (
                                <span className="text-red-500 tracking-wider">Action Required</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--card)] rounded-xl border border-[var(--card-border)] hover:border-indigo-500/30 transition-all group">
                            <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                <UserIcon className="w-4 h-4 text-zinc-500 group-hover:text-indigo-500" />
                            </div>
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hidden lg:block">{user.email}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="p-2.5 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Main Controls & Status */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <TimeTracker user={user} onEntryAdded={fetchEntries} />
                            <ProgressCard entries={entries} />
                        </div>

                        <EntriesTable entries={entries} onEntryDeleted={fetchEntries} onEntryUpdated={fetchEntries} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ManualEntry user={user} onEntryAdded={fetchEntries} />
                            <TaskList />
                        </div>
                        <ProductivityCard entries={entries} />
                    </div>

                    {/* Right Column - Secondary Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <BalanceCard entries={entries} customHolidays={customHolidays} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
                            <WeatherCard />
                            <AyahCard />
                            <QuoteCard />
                        </div>

                        <HolidayCard
                            customHolidays={customHolidays}
                            onHolidaysChange={fetchHolidays}
                        />
                        <PrayerCard />
                    </div>
                </div>
            </main>
        </div>
    );
}
