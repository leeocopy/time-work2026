'use client';

import { useState } from 'react';
import { supabase } from '@/Supabase/supabase';
import { PlusCircle } from 'lucide-react';

interface ManualEntryProps {
    user: any;
    onEntryAdded: () => void;
}

export default function ManualEntry({ user, onEntryAdded }: ManualEntryProps) {
    const [date, setDate] = useState('');
    const [type, setType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
    const [reason, setReason] = useState('End of day');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) return;

        setLoading(true);
        const { error } = await supabase.from('time_entries').insert({
            user_id: user.id,
            type,
            timestamp: new Date(date).toISOString(),
            reason: type === 'CHECK_OUT' ? reason : null
        });

        if (!error) {
            setDate('');
            onEntryAdded();
        }
        setLoading(false);
    };

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight transition-colors">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                        <PlusCircle className="w-5 h-5 text-indigo-500" />
                    </div>
                    Retroactive Log
                </h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-10">Manual Adjustment</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1 text-center block">Temporal Target</label>
                    <input
                        type="datetime-local"
                        className="w-full px-5 py-4 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1 text-center block">Type</label>
                        <select
                            className="w-full px-5 py-4 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-black transition-all appearance-none cursor-pointer"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                        >
                            <option value="CHECK_IN">INFLOW</option>
                            <option value="CHECK_OUT">OUTFLOW</option>
                        </select>
                    </div>
                    {type === 'CHECK_OUT' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1 text-center block">Condition</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-black transition-all appearance-none cursor-pointer"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            >
                                <option value="End of day">EOD</option>
                                <option value="Lunch break">LUNCH</option>
                                <option value="Short break">BREAK</option>
                            </select>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                >
                    {loading ? 'Processing...' : 'Synchronize Record'}
                </button>
            </form>
        </div>
    );
}
