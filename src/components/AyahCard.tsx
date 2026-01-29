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
        <div className="glass-card hover-premium p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden group min-h-[160px] flex flex-col justify-center bg-gradient-to-br from-emerald-600 to-teal-700 border-none">
            <BookOpen className="absolute -top-4 -right-4 w-24 h-24 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
            <div className="relative z-10">
                <p className="text-2xl font-bold text-right mb-6 leading-[1.8] font-arabic drop-shadow-md" dir="rtl">
                    {ayah.text}
                </p>
                <div className="flex items-center gap-3 justify-end">
                    <span className="w-10 h-px bg-white/30"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80">
                        سورة {ayah.surah}
                    </span>
                </div>
            </div>
        </div>
    );
}
