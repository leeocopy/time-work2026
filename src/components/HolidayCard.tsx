'use client';

import { useState } from 'react';
import { Calendar, Trash2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface CustomHoliday {
    id: string;
    name: string;
    date: string;
}

const PUBLIC_HOLIDAYS_2026 = [
    { date: '2026-01-01', name: "Jour de l'An" },
    { date: '2026-04-06', name: 'Lundi de Pâques' },
    { date: '2026-05-01', name: 'Fête du Travail' },
    { date: '2026-05-08', name: 'Victoire 1945' },
    { date: '2026-05-14', name: 'Ascension' },
    { date: '2026-05-25', name: 'Lundi de Pentecôte' },
    { date: '2026-07-14', name: 'Fête Nationale' },
    { date: '2026-08-15', name: 'Assomption' },
    { date: '2026-11-01', name: 'Toussaint' },
    { date: '2026-11-11', name: 'Armistice 1918' },
    { date: '2026-12-25', name: 'Noël' },
];

interface HolidayCardProps {
    customHolidays: CustomHoliday[];
    onHolidaysChange: () => void;
}

export default function HolidayCard({ customHolidays, onHolidaysChange }: HolidayCardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState('');

    const saveHolidays = (list: CustomHoliday[]) => {
        localStorage.setItem('custom_holidays', JSON.stringify(list));
        onHolidaysChange();
    };

    const addHoliday = () => {
        if (!newName || !newDate) return;
        const holiday = { id: Date.now().toString(), name: newName, date: newDate };
        saveHolidays([...customHolidays, holiday]);
        setNewName('');
        setNewDate('');
        setIsAdding(false);
    };

    const deleteHoliday = (id: string) => {
        saveHolidays(customHolidays.filter(h => h.id !== id));
    };

    return (
        <div className="brutalist-card bg-white group">
            <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-black">
                        <Calendar className="w-8 h-8" />
                        HOLIDAYS & LEAVE
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Calendar Overview
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-3 bg-brand-blue text-white border-2 border-black shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                    {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            </div>

            {isAdding && (
                <div className="mb-10 p-6 bg-slate-50 border-4 border-black shadow-[6px_6px_0px_#000] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-black/40">Identifier</label>
                            <input
                                type="text"
                                placeholder="E.G. SICKNESS"
                                className="w-full bg-white border-2 border-black px-4 py-3 text-xs font-black uppercase outline-none focus:bg-brand-mint/10"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-black/40">Target Date</label>
                            <input
                                type="date"
                                className="w-full bg-white border-2 border-black px-4 py-3 text-xs font-black uppercase outline-none focus:bg-brand-mint/10"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={addHoliday}
                        className="btn-brutalist w-full py-4 bg-black text-white"
                    >
                        Save Leave
                    </button>
                </div>
            )}

            <div className="space-y-8 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
                <section>
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-blue border-1 border-black" />
                        Custom Entries
                    </h4>
                    <div className="space-y-3">
                        {customHolidays.map(h => (
                            <div key={h.id} className="flex justify-between items-center p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase italic">{h.name}</span>
                                    <span className="text-[10px] font-black text-black/40 tabular-nums uppercase">{format(new Date(h.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <button
                                    onClick={() => deleteHoliday(h.id)}
                                    className="p-2 bg-brand-orange text-white border-2 border-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {customHolidays.length === 0 && (
                            <p className="text-[10px] font-black text-black/20 uppercase italic py-2">No custom leaves added.</p>
                        )}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-yellow border-1 border-black" />
                        Public (2026)
                    </h4>
                    <div className="space-y-2">
                        {PUBLIC_HOLIDAYS_2026.map(h => (
                            <div key={h.name} className="flex justify-between items-center p-4 bg-slate-50 border-1 border-black/10 hover:bg-white hover:border-black transition-all group">
                                <span className="text-[11px] font-black text-black/60 group-hover:text-black uppercase italic">{h.name}</span>
                                <span className="text-[10px] font-black text-black/40 tabular-nums uppercase">{h.date}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
