'use client';

import { useState, useEffect } from 'react';
import quotesData from '@/lib/quotes.json';
import { Quote as QuoteIcon } from 'lucide-react';

export default function QuoteCard() {
    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * quotesData.length);
        setQuote(quotesData[randomIndex]);
    }, []);

    if (!quote) return null;

    return (
        <div className="brutalist-card bg-slush-purple group">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-white">
                        <QuoteIcon className="w-8 h-8" />
                        CITATION DU JOUR
                    </h3>
                </div>
            </div>

            <div className="bg-white text-black p-6 border-4 border-black shadow-[8px_8px_0px_#000] rotate-1 group-hover:rotate-0 transition-transform">
                <p className="text-xl font-bold text-center leading-[1.8] font-arabic mb-4" dir="rtl">
                    {quote.text}
                </p>
                <div className="flex items-center gap-3 justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
                        {quote.author}
                    </span>
                </div>
            </div>
        </div>
    );
}
