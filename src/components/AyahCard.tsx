'use client';

import { useState, useEffect } from 'react';
import ayahsData from '@/lib/ayahs.json';
import { BookOpen } from 'lucide-react';

export default function AyahCard() {
    const [ayah, setAyah] = useState<any>(null);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * ayahsData.length);
        setAyah(ayahsData[randomIndex]);
    }, []);

    if (!ayah) return null;

    return (
        <div className="brutalist-card bg-brand-lime group">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black italic flex items-center gap-2 md:gap-3 text-black">
                        <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                        VERSET DU JOUR
                    </h3>
                </div>
            </div>

            <div className="bg-black text-white p-4 md:p-6 border-4 border-white shadow-[6px_6px_0px_#000] md:shadow-[8px_8px_0px_#000] -rotate-1 group-hover:rotate-0 transition-transform">
                <p className="text-lg md:text-xl font-bold text-center leading-[1.8] font-arabic mb-4" dir="rtl">
                    {ayah.text}
                </p>
                <div className="flex items-center gap-3 justify-center">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-brand-lime">
                        Sourate {ayah.surah}
                    </span>
                </div>
            </div>
        </div>
    );
}
