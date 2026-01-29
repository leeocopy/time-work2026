'use client';

import { useState } from 'react';
import { Settings, X, Target, MapPin, Save } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workGoal: number;
    city: string;
    onSave: (goal: number, city: string) => void;
}

export default function SettingsModal({ isOpen, onClose, workGoal, city, onSave }: SettingsModalProps) {
    const [tempGoal, setTempGoal] = useState(workGoal);
    const [tempCity, setTempCity] = useState(city);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="brutalist-card bg-white w-full max-w-md p-8 shadow-[12px_12px_0px_#000] rotate-0 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black italic flex items-center gap-3 text-black">
                            <Settings className="w-8 h-8" />
                            CORE CONFIG
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                            Operational Parameters
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-brand-orange text-white border-2 border-black shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] block">Daily Work Target (Hours)</label>
                        <div className="relative">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                            <input
                                type="number"
                                step="0.5"
                                value={tempGoal}
                                onChange={(e) => setTempGoal(parseFloat(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-black outline-none font-black text-xl tabular-nums focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] block">Regional Context (City)</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                            <select
                                value={tempCity}
                                onChange={(e) => setTempCity(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-black outline-none font-black text-sm uppercase appearance-none cursor-pointer focus:bg-white"
                            >
                                <option value="Marrakech">Marrakech</option>
                                <option value="Casablanca">Casablanca</option>
                                <option value="Rabat">Rabat</option>
                                <option value="Agadir">Agadir</option>
                                <option value="Tangier">Tangier</option>
                                <option value="Fes">Fes</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <button
                        onClick={() => {
                            onSave(tempGoal, tempCity);
                            onClose();
                        }}
                        className="btn-brutalist w-full py-5 bg-brand-blue text-white text-xs"
                    >
                        <Save className="w-5 h-5" />
                        SYNCHRONIZE SETTINGS
                    </button>
                </div>
            </div>
        </div>
    );
}
