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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                Manual Entry
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date & Time</label>
                    <input
                        type="datetime-local"
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                        >
                            <option value="CHECK_IN">Check In</option>
                            <option value="CHECK_OUT">Check Out</option>
                        </select>
                    </div>
                    {type === 'CHECK_OUT' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reason</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            >
                                <option value="End of day">End of day</option>
                                <option value="Lunch break">Lunch break</option>
                                <option value="Short break">Short break</option>
                            </select>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Manual Entry'}
                </button>
            </form>
        </div>
    );
}
