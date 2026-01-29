'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/Supabase/supabase';
import { Play, Square, Coffee, Utensils, Clock } from 'lucide-react';
import { TimeEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

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
    const isOnBreak = lastEntry?.type === 'CHECK_OUT' && (lastEntry.reason === 'Short break' || lastEntry.reason === 'Lunch break');

    const getElapsedTime = (timestamp: string) => {
        const diff = currentTime.getTime() - new Date(timestamp).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    return (
        <div className="brutalist-card bg-slush-mint group">
            <div className="flex justify-between items-start mb-10">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3">
                        <Clock className="w-8 h-8" />
                        TIME TRACKER
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Operational Node
                    </p>
                </div>
                <div className="btn-brutalist bg-white py-1 px-3">
                    <span className="text-xl font-black font-mono">
                        {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-12">
                {!isWorking ? (
                    <div className="flex flex-col items-center gap-10">
                        <button
                            onClick={() => handleAction('CHECK_IN')}
                            disabled={loading}
                            className="relative w-48 h-48 rounded-full bg-black text-white border-4 border-white flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[8px_8px_0px_#fff] disabled:opacity-50"
                        >
                            <Play className="w-16 h-16 fill-brand-lime" />
                            <span className="font-black uppercase tracking-[0.2em] text-[10px]">CHECK IN</span>
                        </button>

                        {isOnBreak && (
                            <div className="bg-brand-orange border-2 border-black p-3 shadow-[4px_4px_0px_#000] rotate-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                                    BREAK ACTIVE: {getElapsedTime(lastEntry!.timestamp)}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full gap-10">
                        <div className="bg-white border-4 border-black p-10 shadow-[10px_10px_0px_#000] w-full text-center -rotate-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 block mb-2">Durée Session</span>
                            <span className="text-6xl font-black text-black tracking-tighter tabular-nums">
                                {getElapsedTime(lastEntry!.timestamp)}
                            </span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => handleAction('CHECK_OUT', 'End of day')}
                                disabled={loading}
                                className="btn-brutalist bg-black text-white px-10 py-4 text-xs"
                            >
                                <Square className="w-4 h-4 fill-brand-orange" />
                                CHECK OUT
                            </button>
                            <button
                                onClick={() => handleAction('CHECK_OUT', 'Lunch break')}
                                disabled={loading}
                                className="btn-brutalist bg-brand-yellow text-black px-8 py-4 text-xs"
                            >
                                <Utensils className="w-4 h-4" />
                                LUNCH
                            </button>
                            <button
                                onClick={() => handleAction('CHECK_OUT', 'Short break')}
                                disabled={loading}
                                className="btn-brutalist bg-brand-blue text-white px-8 py-4 text-xs"
                            >
                                <Coffee className="w-4 h-4" />
                                BREAK
                            </button>
                        </div>
                    </div>
                )}

                {lastEntry && (
                    <div className="mt-8 bg-black/10 border-t-2 border-black/20 w-full pt-4 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {isWorking ? 'Checked in at:' : 'Last Checkout'}
                        </p>
                        <span className="text-xs font-black bg-black text-white px-2 py-0.5">
                            {mounted ? new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
