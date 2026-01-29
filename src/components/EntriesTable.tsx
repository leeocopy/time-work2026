'use client';

import { useState } from 'react';
import { TimeEntry } from '@/lib/types';
import { format } from 'date-fns';
import { Trash2, Download, Printer, Pencil, X, Check, Database } from 'lucide-react';
import { supabase } from '@/Supabase/supabase';
import { cn } from '@/lib/utils';

interface EntriesTableProps {
    entries: TimeEntry[];
    onEntryDeleted: () => void;
    onEntryUpdated: () => void;
}

export default function EntriesTable({ entries, onEntryDeleted, onEntryUpdated }: EntriesTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<{ timestamp: string; reason: string }>({ timestamp: '', reason: '' });
    const [filterDate, setFilterDate] = useState<string>('');
    const [showAll, setShowAll] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        const { error } = await supabase.from('time_entries').delete().eq('id', id);
        if (!error) onEntryDeleted();
    };

    const handleStartEdit = (entry: TimeEntry) => {
        setEditingId(entry.id);
        const date = new Date(entry.timestamp);
        const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm");
        setEditValue({ timestamp: formattedDate, reason: entry.reason || '' });
    };

    const handleSaveEdit = async (id: string) => {
        const { error } = await supabase
            .from('time_entries')
            .update({
                timestamp: new Date(editValue.timestamp).toISOString(),
                reason: editValue.reason
            })
            .eq('id', id);

        if (!error) {
            setEditingId(null);
            onEntryUpdated();
        }
    };

    const filteredEntries = filterDate
        ? entries.filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === filterDate)
        : entries;

    const displayedEntries = showAll ? filteredEntries : filteredEntries.slice(0, 5);

    const handleExportCSV = () => {
        const headers = ['Date', 'Time', 'Type', 'Reason'];
        const rows = filteredEntries.map(e => [
            format(new Date(e.timestamp), 'yyyy-MM-dd'),
            format(new Date(e.timestamp), 'HH:mm:ss'),
            e.type,
            e.reason || ''
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time_entries_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Database className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold tracking-tight">Logged Entries</h3>
                        <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-[0.2em]">Operational History • {filteredEntries.length} logs</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <div className="relative group/input flex-1 sm:flex-none h-11">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full sm:w-40 px-4 h-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate('')}
                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 px-2"
                        >
                            Reset
                        </button>
                    )}
                    <div className="h-8 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block mx-1"></div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2.5 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-500 transition-all active:scale-90"
                            title="Print Report"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="p-2.5 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-500 transition-all active:scale-90"
                            title="Export Analytics"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            <th className="py-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-white/5">Date & Time</th>
                            <th className="py-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-white/5">Transition</th>
                            <th className="py-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-white/5">Notes</th>
                            <th className="py-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-white/5 text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                        {displayedEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                <td className="py-5 px-6">
                                    {editingId === entry.id ? (
                                        <input
                                            type="datetime-local"
                                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={editValue.timestamp}
                                            onChange={(e) => setEditValue({ ...editValue, timestamp: e.target.value })}
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-zinc-800 dark:text-zinc-100">
                                                {format(new Date(entry.timestamp), 'MMM dd, yyyy')}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-mono font-black uppercase">
                                                {format(new Date(entry.timestamp), 'HH:mm:ss')}
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="py-5 px-6">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-black tracking-[0.15em] uppercase border",
                                        entry.type === 'CHECK_IN'
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-500/20'
                                            : 'bg-zinc-50 text-zinc-500 dark:bg-white/5 dark:text-zinc-400 border-zinc-100 dark:border-white/10'
                                    )}>
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6">
                                    {editingId === entry.id ? (
                                        <input
                                            type="text"
                                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs w-full max-w-[200px] focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={editValue.reason}
                                            placeholder="Add notes..."
                                            onChange={(e) => setEditValue({ ...editValue, reason: e.target.value })}
                                        />
                                    ) : (
                                        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium italic">
                                            {entry.reason || '—'}
                                        </span>
                                    )}
                                </td>
                                <td className="py-5 px-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                                        {editingId === entry.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveEdit(entry.id)}
                                                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 bg-zinc-100 dark:bg-white/10 text-zinc-500 rounded-xl hover:bg-zinc-200 dark:hover:bg-white/20 transition-all active:scale-90"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStartEdit(entry)}
                                                    className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredEntries.length > 5 && (
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-8 py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-2xl text-[10px] font-black text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all uppercase tracking-[0.25em] active:scale-95 shadow-sm"
                    >
                        {showAll ? 'Collapse List' : `See All ${filteredEntries.length} Records`}
                    </button>
                </div>
            )}

            {filteredEntries.length === 0 && (
                <div className="py-24 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-zinc-100 dark:border-white/5 rotate-6">
                        <div className="w-12 h-12 bg-zinc-200/50 dark:bg-white/10 rounded-2xl flex items-center justify-center -rotate-12">
                            <span className="text-3xl">📝</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">No matching logs</p>
                        <p className="text-xs text-zinc-400 font-medium">Select a different date or start your timer.</p>
                    </div>
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate('')}
                            className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b border-indigo-500/30 pb-0.5 hover:border-indigo-500 transition-all"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
