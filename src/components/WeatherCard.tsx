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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-full flex flex-col items-center justify-center text-center">
            {loading ? (
                <div className="animate-pulse space-y-4 flex flex-col items-center">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                    <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        {getWeatherIcon(weather.weathercode)}
                    </div>
                    <div>
                        <h4 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{Math.round(weather.temperature)}°C</h4>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Marrakech</p>
                    </div>
                    <div className="mt-6 flex gap-6">
                        <div className="flex flex-col items-center">
                            <Wind className="w-4 h-4 text-zinc-400 mb-1" />
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{weather.windspeed} km/h</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
