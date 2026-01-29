'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, MapPin } from 'lucide-react';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    'Marrakech': { lat: 31.6287, lng: -7.9811 },
    'Casablanca': { lat: 33.5731, lng: -7.5898 },
    'Rabat': { lat: 34.0209, lng: -6.8416 },
    'Agadir': { lat: 30.4278, lng: -9.5981 },
    'Tangier': { lat: 35.7595, lng: -5.8340 },
    'Fes': { lat: 34.0333, lng: -5.0000 },
};

export default function WeatherCard({ city = 'Marrakech' }: { city?: string }) {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const coords = CITY_COORDS[city] || CITY_COORDS['Marrakech'];
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`);
                const data = await res.json();
                setWeather(data.current_weather);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [city]);

    const getWeatherInfo = (code: number) => {
        if (code <= 3) return { icon: <Sun className="w-16 h-16 text-brand-yellow" />, condition: 'CIEL DÉGAGÉ' };
        if (code <= 50) return { icon: <Cloud className="w-16 h-16 text-black" />, condition: 'NUAGEUX' };
        return { icon: <CloudRain className="w-16 h-16 text-brand-blue" />, condition: 'PLUVIEUX' };
    };

    const info = weather ? getWeatherInfo(weather.weathercode) : null;

    return (
        <div className="brutalist-card bg-slush-orange group h-full">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-white">
                        <Cloud className="w-8 h-8" />
                        MÉTÉO
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit">
                        {city}, MA
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-6 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white/20 border-4 border-black rotate-12"></div>
                </div>
            ) : info && (
                <div className="flex flex-col gap-6">
                    <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000] flex flex-col items-center -rotate-2 group-hover:rotate-0 transition-transform">
                        <div className="mb-4">{info.icon}</div>
                        <span className="text-6xl font-black text-black tracking-tighter tabular-nums leading-none">
                            {Math.round(weather.temperature)}°
                        </span>
                        <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mt-3">
                            {info.condition}
                        </span>
                    </div>

                    <div className="bg-black text-white p-4 border-2 border-white/20 flex justify-between items-center shadow-[4px_4px_0px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center gap-3">
                            <Wind className="w-5 h-5 text-brand-lime" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase opacity-40">Vent</span>
                                <span className="text-xs font-black">{weather.windspeed} KM/H</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
