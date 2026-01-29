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
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden group h-full flex flex-col justify-center">
            <QuoteIcon className="absolute top-2 right-2 w-12 h-12 text-indigo-500/30 group-hover:rotate-12 transition-transform" />
            <div className="relative z-10">
                <p className="text-xl font-bold text-right mb-4 leading-relaxed font-arabic" dir="rtl">
                    "{quote.text}"
                </p>
                <div className="flex items-center gap-2 justify-end">
                    <span className="w-8 h-px bg-indigo-400"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                        {quote.author}
                    </span>
                </div>
            </div>
        </div>
    );
}
