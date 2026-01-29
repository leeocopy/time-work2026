'use client';

import { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

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
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight transition-colors">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                        </div>
                        Holidays & Leave
                    </h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-10">Calendar Overview</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all active:scale-90"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {isAdding && (
                <div className="mb-8 p-6 bg-zinc-50 dark:bg-black/20 rounded-2xl border border-zinc-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 gap-4">
                        <input
                            type="text"
                            placeholder="Holiday Name (e.g. Sickness)"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <input
                            type="date"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={addHoliday}
                            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            Save Leave
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-3 text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-10 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                <section>
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        Custom Holidays
                    </h4>
                    <div className="space-y-3">
                        {customHolidays.map(h => (
                            <div key={h.id} className="group flex justify-between items-center p-4 bg-zinc-50/50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{h.name}</span>
                                    <span className="text-[10px] font-mono font-bold text-zinc-400">{format(new Date(h.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <button
                                    onClick={() => deleteHoliday(h.id)}
                                    className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {customHolidays.length === 0 && (
                            <p className="text-xs text-zinc-400 italic font-medium py-2">No custom leaves added.</p>
                        )}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Public (2026)
                    </h4>
                    <div className="space-y-2">
                        {PUBLIC_HOLIDAYS_2026.map(h => (
                            <div key={h.name} className="flex justify-between items-center p-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{h.name}</span>
                                <span className="text-[10px] font-mono font-black text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-md">{h.date}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
