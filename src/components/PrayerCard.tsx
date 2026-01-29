'use client';

import { useState, useEffect } from 'react';
import { Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PrayerCard({ city: initialCity = 'Marrakech' }: { city?: string }) {
    const [city, setCity] = useState(initialCity);
    const [prayers, setPrayers] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const cities = ['Marrakech', 'Casablanca', 'Rabat', 'Agadir', 'Tangier', 'Fes', 'Oujda', 'Kenitra'];

    useEffect(() => {
        const fetchPrayers = async () => {
            setLoading(true);
            try {
                const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
                // Method 21 is officially for Morocco (Ministry of Habous)
                const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${date}?city=${city}&country=Morocco&method=21`);
                const data = await res.json();
                setPrayers(data.data.timings);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrayers();
    }, [city]);

    if (loading) return (
        <div className="brutalist-card bg-slush-lime group h-full flex flex-col items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-black border-t-brand-orange animate-spin"></div>
        </div>
    );

    const prayerList = [
        { name: 'Fajr', time: prayers.Fajr },
        { name: 'Dhuhr', time: prayers.Dhuhr },
        { name: 'Asr', time: prayers.Asr },
        { name: 'Maghrib', time: prayers.Maghrib },
        { name: 'Isha', time: prayers.Isha },
    ];

    const getActivePrayer = () => {
        const now = new Date();
        const nowStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        for (let i = prayerList.length - 1; i >= 0; i--) {
            if (nowStr >= prayerList[i].time) return prayerList[i].name;
        }
        return 'Fajr';
    };

    const activePrayer = getActivePrayer();

    return (
        <div className="brutalist-card bg-slush-lime group h-full">
            <div className="flex justify-between items-start mb-10">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-black">
                        <Moon className="w-8 h-8" />
                        PRIÈRES
                    </h3>
                    <div className="mt-2 relative">
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 outline-none border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer appearance-none pr-8"
                        >
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white group-hover:border-t-black" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {prayerList.map((p) => {
                    const isActive = p.name === activePrayer;
                    return (
                        <div
                            key={p.name}
                            className={cn(
                                "flex items-center justify-between p-4 border-2 border-black transition-all",
                                isActive
                                    ? "bg-black text-white scale-105 shadow-[6px_6px_0px_#fff] -rotate-1"
                                    : "bg-white text-black"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Clock className={cn("w-4 h-4", isActive ? "text-brand-yellow" : "text-black/20")} />
                                <span className="text-xs font-black uppercase tracking-widest">{p.name}</span>
                            </div>
                            <span className="text-sm font-black tabular-nums">{p.time}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t-4 border-black/10 flex flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/40">Statut Actuel</p>
                <p className="text-lg font-black text-black italic text-right">Prochaine: {prayerList[(prayerList.findIndex(p => p.name === activePrayer) + 1) % 5].name}</p>
            </div>
        </div>
    );
}
