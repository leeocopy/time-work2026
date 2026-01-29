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
            <div className="flex justify-between items-start mb-6 md:mb-10">
                <div className="flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black italic flex items-center gap-2 md:gap-3 text-black">
                        <Moon className="w-6 h-6 md:w-8 md:h-8" />
                        PRIÈRES
                    </h3>
                    <div className="mt-2 relative">
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 md:px-3 py-1 md:py-1.5 outline-none border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer appearance-none pr-6 md:pr-8"
                        >
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-0 h-0 border-l-[3px] md:border-l-[4px] border-l-transparent border-r-[3px] md:border-r-[4px] border-r-transparent border-t-[3px] md:border-t-[4px] border-t-white group-hover:border-t-black" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2 md:space-y-3">
                {prayerList.map((p) => {
                    const isActive = p.name === activePrayer;
                    return (
                        <div
                            key={p.name}
                            className={cn(
                                "flex items-center justify-between p-3 md:p-4 border-2 border-black transition-all",
                                isActive
                                    ? "bg-black text-white scale-[1.02] md:scale-105 shadow-[4px_4px_0px_#fff] md:shadow-[6px_6px_0px_#fff] -rotate-1"
                                    : "bg-white text-black"
                            )}
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                <Clock className={cn("w-3.5 h-3.5 md:w-4 h-4", isActive ? "text-brand-yellow" : "text-black/20")} />
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{p.name}</span>
                            </div>
                            <span className="text-xs md:text-sm font-black tabular-nums">{p.time}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t-4 border-black/10 flex flex-col gap-1 md:gap-2">
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-black/40">Statut Actuel</p>
                <p className="text-base md:text-lg font-black text-black italic text-right leading-none">Prochaine: {prayerList[(prayerList.findIndex(p => p.name === activePrayer) + 1) % 5].name}</p>
            </div>
        </div>
    );
}
