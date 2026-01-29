'use client';

import { useState } from 'react';
import { TimeEntry } from '@/lib/types';
import { format } from 'date-fns';
import { Trash2, Download, Printer, Database, FileText, Calendar, ChevronUp, ChevronDown, Pencil, X, Save } from 'lucide-react';
import { supabase } from '@/Supabase/supabase';
import { cn, formatHours } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EntriesTableProps {
    entries: TimeEntry[];
    onEntryDeleted: () => void;
    onEntryUpdated: () => void;
}

export default function EntriesTable({ entries, onEntryDeleted, onEntryUpdated }: EntriesTableProps) {
    const [filterDate, setFilterDate] = useState<string>('');
    const [showAll, setShowAll] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editReason, setEditReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        const { error } = await supabase.from('time_entries').delete().eq('id', id);
        if (!error) onEntryDeleted();
    };

    const startEditing = (entry: TimeEntry) => {
        setEditingEntry(entry);
        // Format for datetime-local: YYYY-MM-DDTHH:mm
        const d = new Date(entry.timestamp);
        const formatted = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + 'T' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0');
        setEditDate(formatted);
        setEditReason(entry.reason || '');
    };

    const handleUpdate = async () => {
        if (!editingEntry) return;
        setIsSaving(true);
        const { error } = await supabase.from('time_entries').update({
            timestamp: new Date(editDate).toISOString(),
            reason: editReason
        }).eq('id', editingEntry.id);

        if (!error) {
            setEditingEntry(null);
            onEntryUpdated();
        }
        setIsSaving(false);
    };

    const filteredEntries = filterDate
        ? entries.filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === filterDate)
        : entries;

    const displayedEntries = showAll ? filteredEntries : filteredEntries.slice(0, 5);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('SLUSH TIMER - LOGS', 14, 22);

        const tableColumn = ["Date", "Time", "Type", "Notes"];
        const tableRows = filteredEntries.map(e => [
            format(new Date(e.timestamp), 'MMM dd, yyyy'),
            format(new Date(e.timestamp), 'HH:mm:ss'),
            e.type,
            e.reason || '—'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0] },
        });

        doc.save(`slush_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    return (
        <div className="brutalist-card bg-white overflow-hidden p-0">
            <div className="p-4 md:p-8 border-b-4 border-black flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-brand-yellow">
                <div className="flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black italic flex items-center gap-2 md:gap-3 text-black">
                        <Database className="w-6 h-6 md:w-8 md:h-8" />
                        ENTRY LOGS
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Operational History: {filteredEntries.length} Units
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group flex-1 md:flex-none">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full md:w-auto pl-10 pr-4 py-2 bg-white border-2 border-black font-black text-xs uppercase shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPDF} className="btn-brutalist bg-black text-white p-2 md:p-2.5">
                            <FileText className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black text-white">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Temporal Stamp</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Transition</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Protocol</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                        {displayedEntries.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center font-black text-black/20 text-xl italic uppercase">
                                    No data packets found
                                </td>
                            </tr>
                        ) : (
                            displayedEntries.map((entry) => (
                                <tr key={entry.id} className="group hover:bg-brand-mint/10 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-black">{format(new Date(entry.timestamp), 'MMM dd, yyyy')}</span>
                                            <span className="text-[10px] font-black text-black/40 tabular-nums">{format(new Date(entry.timestamp), 'HH:mm:ss')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 border-2 border-black text-[9px] font-black uppercase tracking-widest",
                                            entry.type === 'CHECK_IN' ? "bg-brand-lime text-black" : "bg-black text-white"
                                        )}>
                                            {entry.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-black text-black/60 italic">
                                            {entry.reason === 'End of day' ? 'Fin de journée' :
                                                entry.reason === 'Lunch break' ? 'Déjeuner' :
                                                    entry.reason === 'Short break' ? 'Pause' :
                                                        entry.reason || '— STANDARD'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => startEditing(entry)}
                                            className="p-2 border-2 border-black bg-brand-blue text-white shadow-[3px_3px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-2 border-2 border-black bg-brand-orange text-white shadow-[3px_3px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden">
                <div className="divide-y-2 divide-black">
                    {displayedEntries.length === 0 ? (
                        <div className="px-6 py-12 text-center font-black text-black/20 text-lg italic uppercase">
                            No data packets found
                        </div>
                    ) : (
                        displayedEntries.map((entry) => (
                            <div key={entry.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-black">{format(new Date(entry.timestamp), 'MMM dd, yyyy')}</span>
                                        <span className="text-[10px] font-black text-black/40 tabular-nums">{format(new Date(entry.timestamp), 'HH:mm:ss')}</span>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-2 px-2 py-0.5 border-2 border-black text-[8px] font-black uppercase tracking-widest",
                                        entry.type === 'CHECK_IN' ? "bg-brand-lime text-black" : "bg-black text-white"
                                    )}>
                                        {entry.type.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-black/60 italic">
                                        {entry.reason === 'End of day' ? 'Fin de journée' :
                                            entry.reason === 'Lunch break' ? 'Déjeuner' :
                                                entry.reason === 'Short break' ? 'Pause' :
                                                    entry.reason || '— STANDARD'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEditing(entry)}
                                            className="p-1.5 border-2 border-black bg-brand-blue text-white shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-1.5 border-2 border-black bg-brand-orange text-white shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {filteredEntries.length > 5 && (
                <div className="p-6 bg-black flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="btn-brutalist bg-brand-yellow text-black border-white shadow-[4px_4px_0px_#fff] uppercase text-[10px] tracking-[0.2em]"
                    >
                        {showAll ? (
                            <>Show Less <ChevronUp className="w-4 h-4 ml-2" /></>
                        ) : (
                            <>See More <ChevronDown className="w-4 h-4 ml-2" /></>
                        )}
                    </button>
                </div>
            )}
            {/* Edit Modal */}
            {editingEntry && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="brutalist-card bg-white w-full max-w-md p-8 shadow-[12px_12px_0px_#000]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black italic flex items-center gap-3">
                                <Pencil className="w-6 h-6" />
                                EDIT ENTRY
                            </h3>
                            <button onClick={() => setEditingEntry(null)} className="p-2 bg-brand-orange text-white border-2 border-black shadow-[4px_4px_0px_#000]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black/40 uppercase tracking-widest block">Timestamp</label>
                                <input
                                    type="datetime-local"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-black font-black text-sm outline-none focus:bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black/40 uppercase tracking-widest block">Reason / Protocol</label>
                                <select
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-black font-black text-sm outline-none focus:bg-white cursor-pointer"
                                >
                                    <option value="">Standard Protocol</option>
                                    <option value="End of day">End of day</option>
                                    <option value="Lunch break">Lunch break</option>
                                    <option value="Short break">Short break</option>
                                </select>
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="btn-brutalist w-full py-4 bg-brand-lime text-black mt-4"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'UPDATING...' : 'SAVE CHANGES'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
