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
        <div className="brutalist-card bg-white group">
            <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-black">
                        <PlusCircle className="w-8 h-8" />
                        RETROACTIVE LOG
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Manual Adjustment
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] block">Temporal Target</label>
                    <input
                        type="datetime-local"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-black outline-none text-xs font-black uppercase transition-all focus:bg-white"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] block">Type</label>
                        <select
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-black outline-none text-xs font-black uppercase transition-all focus:bg-white cursor-pointer"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                        >
                            <option value="CHECK_IN">INFLOW</option>
                            <option value="CHECK_OUT">OUTFLOW</option>
                        </select>
                    </div>
                    {type === 'CHECK_OUT' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] block">Condition</label>
                            <select
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-black outline-none text-xs font-black uppercase transition-all focus:bg-white cursor-pointer"
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
                    className="btn-brutalist w-full py-5 bg-brand-blue text-white"
                >
                    {loading ? 'Processing...' : 'Synchronize Record'}
                </button>
            </form>
        </div>
    );
}
