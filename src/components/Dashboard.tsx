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
import SettingsModal from './SettingsModal';
import { LogOut, User as UserIcon, LayoutDashboard, Database, AlertCircle, CheckCircle, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomHoliday } from './HolidayCard';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
    user: any;
}

export default function Dashboard({ user }: DashboardProps) {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
    const [profileStatus, setProfileStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [workGoal, setWorkGoal] = useState(8.5);
    const [city, setCity] = useState('Marrakech');
    const [collapsed, setCollapsed] = useState<string[]>([]);

    const fetchHolidays = () => {
        const saved = localStorage.getItem('custom_holidays');
        const savedGoal = localStorage.getItem('work_goal');
        const savedCity = localStorage.getItem('user_city');
        const savedCollapsed = localStorage.getItem('collapsed_cards');

        if (saved) {
            try {
                setCustomHolidays(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse holidays", e);
            }
        } else {
            setCustomHolidays([]);
        }

        if (savedGoal) setWorkGoal(parseFloat(savedGoal));
        if (savedCity) setCity(savedCity);
        if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
    };

    const saveSettings = (goal: number, newCity: string) => {
        setWorkGoal(goal);
        setCity(newCity);
        localStorage.setItem('work_goal', goal.toString());
        localStorage.setItem('user_city', newCity);
    };

    const toggleCollapse = (id: string) => {
        const newCollapsed = collapsed.includes(id)
            ? collapsed.filter(c => c !== id)
            : [...collapsed, id];
        setCollapsed(newCollapsed);
        localStorage.setItem('collapsed_cards', JSON.stringify(newCollapsed));
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
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20 selection:bg-brand-yellow/30">
            {/* High-Contrast Brutalist Header */}
            <header className="sticky top-0 z-50 bg-black text-white border-b-4 border-black">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-yellow border-2 border-white flex items-center justify-center -rotate-2">
                            <LayoutDashboard className="w-5 h-5 md:w-7 md:h-7 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none italic">TIME WORK ABDOU</h1>
                            <span className="text-[8px] md:text-[10px] font-black text-brand-mint uppercase tracking-[0.3em]">Operational Node v2.0</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/10 border-2 border-white/20">
                            <div className={`w-3 h-3 rounded-full ${profileStatus === 'ok' ? 'bg-brand-lime' : 'bg-brand-orange animate-pulse'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                {profileStatus === 'ok' ? 'SYNCED' : 'OFFLINE'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 md:p-3 bg-brand-blue border-2 border-black shadow-[3px_3px_0px_#fff] md:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </button>

                            <button
                                onClick={handleSignOut}
                                className="p-2 md:p-3 bg-brand-orange border-2 border-black shadow-[3px_3px_0px_#fff] md:shadow-[4px_4px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                <LogOut className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                workGoal={workGoal}
                city={city}
                onSave={saveSettings}
            />

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 mt-6 md:mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Left Column - Main Controls & Status */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <TimeTracker user={user} onEntryAdded={fetchEntries} />
                            <ProgressCard entries={entries} workGoal={workGoal} />
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
                        <BalanceCard entries={entries} customHolidays={customHolidays} workGoal={workGoal} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
                            <CollapsibleCard
                                id="weather"
                                title="Climatic Context"
                                isCollapsed={collapsed.includes('weather')}
                                onToggle={() => toggleCollapse('weather')}
                            >
                                <WeatherCard city={city} />
                            </CollapsibleCard>

                            <CollapsibleCard
                                id="ayah"
                                title="Spiritual Beacon"
                                isCollapsed={collapsed.includes('ayah')}
                                onToggle={() => toggleCollapse('ayah')}
                            >
                                <AyahCard />
                            </CollapsibleCard>

                            <CollapsibleCard
                                id="quote"
                                title="Intellectual Pulse"
                                isCollapsed={collapsed.includes('quote')}
                                onToggle={() => toggleCollapse('quote')}
                            >
                                <QuoteCard />
                            </CollapsibleCard>
                        </div>

                        <CollapsibleCard
                            id="holidays"
                            title="Calendar Matrix"
                            isCollapsed={collapsed.includes('holidays')}
                            onToggle={() => toggleCollapse('holidays')}
                        >
                            <HolidayCard
                                customHolidays={customHolidays}
                                onHolidaysChange={fetchHolidays}
                            />
                        </CollapsibleCard>

                        <CollapsibleCard
                            id="prayer"
                            title="Temporal Alignment"
                            isCollapsed={collapsed.includes('prayer')}
                            onToggle={() => toggleCollapse('prayer')}
                        >
                            <PrayerCard city={city} />
                        </CollapsibleCard>
                    </div>
                </div>
            </main>
        </div>
    );
}

function CollapsibleCard({ id, title, children, isCollapsed, onToggle }: { id: string, title: string, children: React.ReactNode, isCollapsed: boolean, onToggle: () => void }) {
    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={onToggle}
                className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-black shadow-[3px_3px_0px_#000] md:shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all group"
            >
                <span className="text-[10px] md:text-[11px] font-black text-black uppercase tracking-[0.15em] md:tracking-[0.2em]">{title}</span>
                <div className="p-1 bg-black text-white">
                    {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </div>
            </button>
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden pt-2"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
