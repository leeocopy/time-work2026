'use client';

import { useState } from 'react';
import { Calendar, Trash2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PUBLIC_HOLIDAYS } from '@/lib/constants';

export interface CustomHoliday {
    id: string;
    name: string;
    date: string;
}


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
                    <h3 className="text-xl md:text-2xl font-black italic flex items-center gap-2 md:gap-3 text-black">
                        <Calendar className="w-6 h-6 md:w-8 md:h-8" />
                        CONGÉS & FÉRIÉS
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Aperçu Calendrier
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 md:p-3 bg-brand-blue text-white border-2 border-black shadow-[3px_3px_0px_#000] md:shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                    {isAdding ? <X className="w-4 h-4 md:w-5 md:h-5" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 md:mb-10 p-4 md:p-6 bg-slate-50 border-4 border-black shadow-[4px_4px_0px_#000] md:shadow-[6px_6px_0px_#000] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3 md:space-y-4">
                        <div className="space-y-1">
                            <label className="text-[8px] md:text-[9px] font-black uppercase text-black/40">Identifier</label>
                            <input
                                type="text"
                                placeholder="EX: MALADIE, ABSENCE..."
                                className="w-full bg-white border-2 border-black px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs font-black uppercase outline-none focus:bg-brand-mint/10"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] md:text-[9px] font-black uppercase text-black/40">Date</label>
                            <input
                                type="date"
                                className="w-full bg-white border-2 border-black px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs font-black uppercase outline-none focus:bg-brand-mint/10"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={addHoliday}
                        className="btn-brutalist w-full py-3 md:py-4 bg-black text-white text-[10px] md:text-xs"
                    >
                        Enregistrer
                    </button>
                </div>
            )}

            <div className="space-y-8 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
                <section>
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-blue border-1 border-black" />
                        Congés Personnalisés
                    </h4>
                    <div className="space-y-3">
                        {customHolidays.map(h => (
                            <div key={h.id} className="flex justify-between items-center p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase italic">{h.name}</span>
                                    <span className="text-[10px] font-black text-black/40 tabular-nums uppercase">{format(new Date(h.date), 'dd MMM yyyy')}</span>
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
                            <p className="text-[10px] font-black text-black/20 uppercase italic py-2">Aucun congé ajouté.</p>
                        )}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-yellow border-1 border-black" />
                        Jours Fériés (2026)
                    </h4>
                    <div className="space-y-2">
                        {PUBLIC_HOLIDAYS.map(h => (
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
