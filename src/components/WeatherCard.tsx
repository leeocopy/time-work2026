'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';

export default function WeatherCard() {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Using Open-Meteo as a free alternative that doesn't require keys
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=31.6287&longitude=-7.9811&current_weather=true`);
                const data = await res.json();
                setWeather(data.current_weather);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code <= 3) return <Sun className="w-12 h-12 text-amber-500" />;
        if (code <= 50) return <Cloud className="w-12 h-12 text-zinc-400" />;
        return <CloudRain className="w-12 h-12 text-indigo-400" />;
    };

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />

            {loading ? (
                <div className="animate-pulse space-y-6 flex flex-col items-center py-4">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-[2.5rem] rotate-12"></div>
                    <div className="h-10 w-24 bg-zinc-100 dark:bg-white/5 rounded-2xl"></div>
                </div>
            ) : (
                <>
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 w-20 h-20 bg-zinc-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-zinc-100 dark:border-white/5 shadow-inner rotate-3 group-hover:rotate-12 transition-transform duration-500">
                            {getWeatherIcon(weather.weathercode)}
                        </div>
                    </div>

                    <div className="relative z-10 space-y-1">
                        <h4 className="text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter drop-shadow-sm">
                            {Math.round(weather.temperature)}°C
                        </h4>
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Marrakech, MA</p>
                            <div className="h-px w-8 bg-amber-500/30 mt-3" />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-8 relative z-10">
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 min-w-[80px]">
                            <Wind className="w-4 h-4 text-zinc-400" />
                            <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{weather.windspeed} km/h</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
