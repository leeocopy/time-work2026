'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PrayerCard() {
    const [times, setTimes] = useState<any>(null);
    const [city, setCity] = useState('Marrakech');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedCity = localStorage.getItem('prayer_city');
        if (savedCity) setCity(savedCity);
    }, []);

    useEffect(() => {
        const fetchTimes = async () => {
            try {
                const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Morocco&method=3`);
                const data = await res.json();
                setTimes(data.data.timings);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTimes();
    }, [city]);

    const handleCityChange = (newCity: string) => {
        setCity(newCity);
        localStorage.setItem('prayer_city', newCity);
    };

    const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const prayers = prayerOrder.map(name => ({
        name: name,
        time: times ? times[name] : '--:--'
    }));

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight transition-colors">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                        Prayer Schedule
                    </h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-10 font-arabic">Al-Adhan • Marrakech</p>
                </div>
                {/* City selection removed from header as per new layout, but keeping the original logic for now */}
                {/* <div className="flex items-center gap-1 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full font-bold uppercase text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    <select
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="bg-transparent border-none outline-none cursor-pointer"
                    >
                        <option value="Marrakech">Marrakech</option>
                        <option value="Casablanca">Casablanca</option>
                        <option value="Rabat">Rabat</option>
                    </select>
                </div> */}
            </div>

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {prayerOrder.map(name => (
                        <div key={name} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{name}</span>
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{times[name]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
