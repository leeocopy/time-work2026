'use client';

import { useState } from 'react';
import { TimeEntry } from '@/lib/types';
import { format } from 'date-fns';
import { Trash2, Download, Printer, Database, FileText, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        const { error } = await supabase.from('time_entries').delete().eq('id', id);
        if (!error) onEntryDeleted();
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
            <div className="p-8 border-b-4 border-black flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-yellow">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-black">
                        <Database className="w-8 h-8" />
                        ENTRY LOGS
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Operational History: {filteredEntries.length} Units
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border-2 border-black font-black text-xs uppercase shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportPDF} className="btn-brutalist bg-black text-white p-2.5">
                            <FileText className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
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
                                    <td className="px-8 py-5 text-right">
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

            {filteredEntries.length > 5 && (
                <div className="p-6 bg-black flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="btn-brutalist bg-brand-yellow text-black border-white shadow-[4px_4px_0px_#fff]"
                    >
                        {showAll ? (
                            <>Collapse <ChevronUp className="w-4 h-4" /></>
                        ) : (
                            <>Expand Matrix <ChevronDown className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
