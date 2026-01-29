'use client';

import { useState, useEffect, useMemo } from 'react';
import { TimeEntry } from '@/lib/types';
import {
    startOfMonth,
    eachDayOfInterval,
    isWeekend,
    format,
    isSameDay,
    endOfYesterday,
    isBefore,
    isAfter
} from 'date-fns';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
    entries: TimeEntry[];
}

const PUBLIC_HOLIDAYS_2026 = [
    '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
    '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25'
];

export default function BalanceCard({ entries }: BalanceCardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [customHolidays, setCustomHolidays] = useState<string[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Live updates

        // Load custom holidays
        const saved = localStorage.getItem('custom_holidays');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCustomHolidays(parsed.map((h: any) => h.date));
            } catch (e) {
                console.error("Failed to parse holidays", e);
            }
        }

        return () => clearInterval(timer);
    }, []);

    const getRequiredHoursForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Check if weekend or Public holiday or Custom Leave/Holiday
        if (isWeekend(date) || PUBLIC_HOLIDAYS_2026.includes(dateStr) || customHolidays.includes(dateStr)) {
            return 0;
        }
        const day = date.getDay(); // 0 is Sunday, 5 is Friday
        return day === 5 ? 7.5 : 8.5;
    };

    const { dailyBalance, monthlyBalance } = useMemo(() => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const requiredHoursToday = getRequiredHoursForDay(today);

        // --- 1. Daily Balance ---
        const todayEntries = entries
            .filter((e) => format(new Date(e.timestamp), 'yyyy-MM-dd') === todayStr)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let totalWorkMillis = 0;
        let lastCheckInTime: Date | null = null;

        for (const entry of todayEntries) {
            const entryTime = new Date(entry.timestamp);
            if (entry.type === 'CHECK_IN') {
                lastCheckInTime = entryTime;
            } else if (entry.type === 'CHECK_OUT' && lastCheckInTime) {
                totalWorkMillis += entryTime.getTime() - lastCheckInTime.getTime();
                lastCheckInTime = null;
            }
        }

        if (lastCheckInTime) {
            totalWorkMillis += currentTime.getTime() - lastCheckInTime.getTime();
        }

        const dailyHours = totalWorkMillis / (1000 * 60 * 60);
        const dailyBal = dailyHours - requiredHoursToday;

        // --- 2. Monthly Cumulative Balance ---
        const monthStart = startOfMonth(today);
        const yesterday = endOfYesterday();
        let carryOverBalance = 0;

        if (isAfter(yesterday, monthStart) || isSameDay(yesterday, monthStart)) {
            const daysInMonthSoFar = eachDayOfInterval({ start: monthStart, end: yesterday });

            for (const day of daysInMonthSoFar) {
                const reqHours = getRequiredHoursForDay(day);
                if (reqHours === 0) continue;

                const dayStr = format(day, 'yyyy-MM-dd');
                const dayEntries = entries
                    .filter((e) => format(new Date(e.timestamp), 'yyyy-MM-dd') === dayStr)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                let dayTotalMillis = 0;
                let dayLastCheckIn: Date | null = null;

                for (const entry of dayEntries) {
                    const entryTime = new Date(entry.timestamp);
                    if (entry.type === 'CHECK_IN') {
                        dayLastCheckIn = entryTime;
                    } else if (entry.type === 'CHECK_OUT' && dayLastCheckIn) {
                        dayTotalMillis += entryTime.getTime() - dayLastCheckIn.getTime();
                        dayLastCheckIn = null;
                    }
                }

                const dayHours = dayTotalMillis / (1000 * 60 * 60);
                carryOverBalance += (dayHours - reqHours);
            }
        }

        return {
            dailyBalance: dailyBal,
            monthlyBalance: carryOverBalance + dailyBal
        };
    }, [entries, currentTime, customHolidays]);

    const formatBalance = (balance: number) => {
        const isNegative = balance < 0;
        const absMins = Math.round(Math.abs(balance) * 60);
        const h = Math.floor(absMins / 60);
        const m = absMins % 60;
        return {
            text: `${isNegative ? '-' : '+'}${h}h ${m}m`,
            isNegative
        };
    };

    const daily = formatBalance(dailyBalance);
    const monthly = formatBalance(monthlyBalance);

    return (
        <div className="bg-white dark:bg-zinc-900 px-6 py-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Balance Overview
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium italic">
                    Your work hours balance.
                </p>
            </div>

            <div className="space-y-4">
                {/* Daily Balance Card */}
                <div className={cn(
                    "p-6 rounded-2xl flex flex-col items-center gap-1 transition-colors",
                    daily.isNegative
                        ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                        : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                )}>
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-tight">Daily Balance</span>
                    <span className={cn(
                        "text-4xl font-extrabold tracking-tighter",
                        daily.isNegative ? "text-red-500" : "text-emerald-500"
                    )}>
                        {daily.text}
                    </span>
                </div>

                {/* Monthly Balance Card */}
                <div className={cn(
                    "p-6 rounded-2xl flex flex-col items-center gap-1 transition-colors",
                    monthly.isNegative
                        ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                        : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                )}>
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-tight">Monthly Balance</span>
                    <span className={cn(
                        "text-4xl font-extrabold tracking-tighter",
                        monthly.isNegative ? "text-red-500" : "text-emerald-500"
                    )}>
                        {monthly.text}
                    </span>
                </div>
            </div>

            <p className="text-[10px] text-center text-zinc-400 uppercase font-black tracking-widest">
                Resets on the 1st of {format(new Date(), 'MMMM')}
            </p>
        </div>
    );
}
