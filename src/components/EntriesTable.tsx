'use client';

import { TimeEntry } from '@/lib/types';
import { format } from 'date-fns';
import { Trash2, Download, Printer } from 'lucide-react';
import { supabase } from '@/Supabase/supabase';

interface EntriesTableProps {
    entries: TimeEntry[];
    onEntryDeleted: () => void;
}

export default function EntriesTable({ entries, onEntryDeleted }: EntriesTableProps) {
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        const { error } = await supabase.from('time_entries').delete().eq('id', id);
        if (!error) onEntryDeleted();
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Time', 'Type', 'Reason'];
        const rows = entries.map(e => [
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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Logged Entries</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 transition-colors"
                        title="Print"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 transition-colors"
                        title="Export CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Time</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Reason</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                <td className="py-4 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                                    {format(new Date(entry.timestamp), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-4 px-4 text-zinc-600 dark:text-zinc-400 font-mono font-bold">
                                    {format(new Date(entry.timestamp), 'HH:mm:ss')}
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${entry.type === 'CHECK_IN'
                                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                        }`}>
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400 italic">
                                    {entry.reason || '-'}
                                </td>
                                <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-1 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {entries.length === 0 && (
                <div className="py-12 text-center text-zinc-500 italic">
                    No logs found. Start your timer to begin!
                </div>
            )}
        </div>
    );
}
