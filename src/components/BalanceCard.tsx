'use client';

import { useState, useEffect, useMemo } from 'react';
import { TimeEntry } from '@/lib/types';
import {
    startOfMonth,
    endOfDay,
    eachDayOfInterval,
    isSameDay,
    isWeekend,
    differenceInMinutes,
    format
} from 'date-fns';
import { Wallet } from 'lucide-react';

interface BalanceCardProps {
    entries: TimeEntry[];
}

export default function BalanceCard({ entries }: BalanceCardProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const monthlyStats = useMemo(() => {
        if (!mounted) return { balance: 0, isPositive: true, absBalance: 0 };
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfDay(today);

        const daysInMonth = eachDayOfInterval({ start, end });
        let totalWorked = 0;
        let totalRequired = 0;

        daysInMonth.forEach(day => {
            const dayEntries = entries
                .filter(e => isSameDay(new Date(e.timestamp), day))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Check if weekend (no required hours on Sat/Sun)
            if (!isWeekend(day)) {
                totalRequired += 8.5 * 60; // 8.5h required for weekdays
            }

            // Calculate worked time for the day
            for (let i = 0; i < dayEntries.length; i++) {
                const current = dayEntries[i];
                const next = dayEntries[i + 1];

                if (current.type === 'CHECK_IN') {
                    const endTime = next ? new Date(next.timestamp) : (isSameDay(day, today) ? new Date() : new Date(day.setHours(23, 59, 59)));
                    totalWorked += differenceInMinutes(endTime, new Date(current.timestamp));
                }
            }
        });

        const balance = totalWorked - totalRequired;

        return {
            balance,
            isPositive: balance >= 0,
            absBalance: Math.abs(balance)
        };
    }, [entries]);

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-500" />
                Monthly Balance
            </h3>

            <div className="flex flex-col items-center py-4">
                <div className={`text-4xl font-bold font-mono ${monthlyStats.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {monthlyStats.isPositive ? '+' : '-'}{formatHours(monthlyStats.absBalance)}
                </div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 uppercase tracking-widest italic">
                    {monthlyStats.isPositive ? 'Surplus Balance' : 'Current Deficit'}
                </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-white dark:bg-zinc-900 p-4 flex flex-col items-center">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Scale</span>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">8.5h / day</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 flex flex-col items-center">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Cycle</span>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{mounted ? format(new Date(), 'MMMM') : '...'}</span>
                </div>
            </div>
        </div>
    );
}
