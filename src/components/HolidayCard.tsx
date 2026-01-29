'use client';

import { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface CustomHoliday {
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

export default function HolidayCard() {
    const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('custom_holidays');
        if (saved) setCustomHolidays(JSON.parse(saved));
    }, []);

    const saveHolidays = (list: CustomHoliday[]) => {
        setCustomHolidays(list);
        localStorage.setItem('custom_holidays', JSON.stringify(list));
    };

    const handleAdd = () => {
        if (!newName || !newDate) return;
        const holiday = { id: Date.now().toString(), name: newName, date: newDate };
        saveHolidays([...customHolidays, holiday]);
        setNewName('');
        setNewDate('');
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        saveHolidays(customHolidays.filter(h => h.id !== id));
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Holidays & Leave
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {isAdding ? 'Cancel' : 'Add'}
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl space-y-3">
                    <input
                        type="text"
                        placeholder="Holiday name..."
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-semibold"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                        type="date"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-semibold"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                    />
                    <button
                        onClick={handleAdd}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs"
                    >
                        Save Holiday
                    </button>
                </div>
            )}

            <div className="flex-1 space-y-6 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                <section>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Custom Holidays</h4>
                    <div className="space-y-2">
                        {customHolidays.map(h => (
                            <div key={h.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{h.name}</span>
                                    <span className="text-[10px] text-zinc-500">{format(new Date(h.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <button onClick={() => handleDelete(h.id)} className="p-1 opacity-0 group-hover:opacity-100 text-red-500 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {customHolidays.length === 0 && <p className="text-[10px] text-zinc-400 italic py-2">No custom holidays added.</p>}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Public (2026)</h4>
                    <div className="space-y-2">
                        {PUBLIC_HOLIDAYS_2026.map(h => (
                            <div key={h.date} className="flex justify-between items-center p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{h.name}</span>
                                <span className="text-[10px] font-bold text-zinc-500">{format(new Date(h.date), 'dd/MM')}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
