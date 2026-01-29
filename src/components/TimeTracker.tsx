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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Time Tracker
                </h3>
                <div className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                </div>
            </div>

            <div className="flex flex-col items-center gap-6">
                {!isWorking ? (
                    <button
                        onClick={() => handleAction('CHECK_IN')}
                        disabled={loading}
                        className="w-32 h-32 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 group disabled:opacity-50"
                    >
                        <Play className="w-10 h-10 fill-current group-hover:scale-110 transition-transform" />
                        <span className="font-bold">Check In</span>
                    </button>
                ) : (
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => handleAction('CHECK_OUT', 'End of day')}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold flex items-center gap-2 hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                            <Square className="w-5 h-5 fill-current" />
                            End Day
                        </button>
                        <button
                            onClick={() => handleAction('CHECK_OUT', 'Lunch break')}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2 hover:bg-orange-200 transition-colors disabled:opacity-50"
                        >
                            <Utensils className="w-5 h-5" />
                            Lunch
                        </button>
                        <button
                            onClick={() => handleAction('CHECK_OUT', 'Short break')}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 hover:bg-amber-200 transition-colors disabled:opacity-50"
                        >
                            <Coffee className="w-5 h-5" />
                            Break
                        </button>
                    </div>
                )}

                {lastEntry && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Last event: <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {lastEntry.type === 'CHECK_IN' ? 'Started at' : `Stopped (${lastEntry.reason}) at`} {mounted ? new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}
