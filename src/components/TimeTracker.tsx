'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/Supabase/supabase';
import { Play, Square, Coffee, Utensils, Clock } from 'lucide-react';
import { TimeEntry } from '@/lib/types';

interface TimeTrackerProps {
    user: any;
    onEntryAdded: () => void;
}

export default function TimeTracker({ user, onEntryAdded }: TimeTrackerProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastEntry, setLastEntry] = useState<TimeEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchLastEntry();
        return () => clearInterval(timer);
    }, []);

    const fetchLastEntry = async () => {
        const { data } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

        setLastEntry(data);
    };

    const handleAction = async (type: 'CHECK_IN' | 'CHECK_OUT', reason?: string) => {
        setLoading(true);
        const { error } = await supabase.from('time_entries').insert({
            user_id: user.id,
            type,
            timestamp: new Date().toISOString(),
            reason
        });

        if (!error) {
            await fetchLastEntry();
            onEntryAdded();
        }
        setLoading(false);
    };

    const isWorking = lastEntry?.type === 'CHECK_IN';

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="flex justify-between items-center relative z-10">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                        Time Tracker
                    </h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-10">Live Analytics</p>
                </div>
                <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10 shadow-inner">
                    <span className="text-2xl font-black font-mono tracking-tighter text-indigo-600 dark:text-indigo-400">
                        {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-8 relative z-10">
                {!isWorking ? (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                        <button
                            onClick={() => handleAction('CHECK_IN')}
                            disabled={loading}
                            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-500/40 disabled:opacity-50 border-4 border-white/10"
                        >
                            <Play className="w-12 h-12 fill-current drop-shadow-lg" />
                            <span className="font-black uppercase tracking-widest text-xs">Check In</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                            <div className="absolute inset-2 bg-indigo-500/40 rounded-full animate-pulse" />
                            <div className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                <Clock className="w-8 h-8 text-white animate-spin-slow" />
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                onClick={() => handleAction('CHECK_OUT', 'End of day')}
                                disabled={loading}
                                className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Square className="w-4 h-4 fill-current" />
                                End Day
                            </button>
                            <button
                                onClick={() => handleAction('CHECK_OUT', 'Lunch break')}
                                disabled={loading}
                                className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-orange-500/50 hover:text-orange-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Utensils className="w-4 h-4" />
                                Lunch
                            </button>
                            <button
                                onClick={() => handleAction('CHECK_OUT', 'Short break')}
                                disabled={loading}
                                className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-amber-500/50 hover:text-amber-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Coffee className="w-4 h-4" />
                                Break
                            </button>
                        </div>
                    </div>
                )}

                {lastEntry && (
                    <div className="px-4 py-2 bg-zinc-50 dark:bg-black/20 rounded-full border border-zinc-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {lastEntry.type === 'CHECK_IN' ? 'Active session started at' : `Last break (${lastEntry.reason}) at`}
                            <span className="ml-2 text-zinc-800 dark:text-zinc-200 font-black">
                                {mounted ? new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
