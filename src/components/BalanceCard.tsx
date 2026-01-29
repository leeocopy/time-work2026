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
        const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1
        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            return 8.5; // Monday to Thursday
        }
        if (dayOfWeek === 5) {
            return 7.5; // Friday
        }
        return 0; // Weekend
    };

    const { workedToday, requiredToday, remainingToday, monthlyBalance } = useMemo(() => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        // 1. Expected Today (Weekly target)
        const expectedToday = getRequiredHoursForDay(today);

        // 2. Balance Before Today (Monthly running balance up to yesterday)
        const monthStart = startOfMonth(today);
        const yesterday = endOfYesterday();
        let balanceBeforeToday = 0;

        if (isAfter(yesterday, monthStart) || isSameDay(yesterday, monthStart)) {
            const pastDays = eachDayOfInterval({ start: monthStart, end: yesterday });
            for (const day of pastDays) {
                const req = getRequiredHoursForDay(day);
                if (req === 0) continue;

                const dayStr = format(day, 'yyyy-MM-dd');
                const dayEntries = entries
                    .filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === dayStr)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                let dayMillis = 0;
                let lastIn: number | null = null;
                for (const e of dayEntries) {
                    const t = new Date(e.timestamp).getTime();
                    if (e.type === 'CHECK_IN') {
                        lastIn = t;
                    } else if (e.type === 'CHECK_OUT' && lastIn) {
                        dayMillis += t - lastIn;
                        lastIn = null;
                    }
                }
                balanceBeforeToday += (dayMillis / (1000 * 3600)) - req;
            }
        }

        // 3. Worked Today So Far (Live update)
        const todayEntries = entries
            .filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === todayStr)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let workedTodayMillis = 0;
        let lastInToday: number | null = null;
        for (const e of todayEntries) {
            const t = new Date(e.timestamp).getTime();
            if (e.type === 'CHECK_IN') {
                lastInToday = t;
            } else if (e.type === 'CHECK_OUT' && lastInToday) {
                workedTodayMillis += t - lastInToday;
                lastInToday = null;
            }
        }
        if (lastInToday) {
            workedTodayMillis += currentTime.getTime() - lastInToday;
        }
        const workedTodayHours = workedTodayMillis / (1000 * 3600);

        // 4. Required Today (Adjusted by carry-over: Point 4)
        // If I was -1h yesterday, I need expectedToday + 1h today.
        const requiredWorkedToday = expectedToday - balanceBeforeToday;

        // 5. Remaining Today (Point 5)
        const remainingTodayHours = requiredWorkedToday - workedTodayHours;

        // 6. Running Monthly Balance (Point 3)
        const currentMonthlyBalance = balanceBeforeToday + (workedTodayHours - expectedToday);

        return {
            workedToday: workedTodayHours,
            requiredToday: requiredWorkedToday,
            remainingToday: remainingTodayHours,
            monthlyBalance: currentMonthlyBalance
        };
    }, [entries, currentTime, customHolidays]);

    const formatDuration = (hours: number) => {
        const isNegative = hours < 0;
        const absMins = Math.round(Math.abs(hours) * 60);
        const h = Math.floor(absMins / 60);
        const m = absMins % 60;
        return {
            text: `${isNegative ? '-' : '+'}${h}h ${m}m`,
            isNegative
        };
    };

    const formatSimple = (hours: number) => {
        const absMins = Math.round(Math.abs(hours) * 60);
        const h = Math.floor(absMins / 60);
        const m = absMins % 60;
        return `${h}h ${m}m`;
    };

    const remaining = formatDuration(remainingToday);
    const monthly = formatDuration(monthlyBalance);

    return (
        <div className="bg-white dark:bg-zinc-900 px-6 py-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Balance Overview
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium italic">
                    Your live work progress.
                </p>
            </div>

            <div className="space-y-4">
                {/* Daily Status Section */}
                <div className={cn(
                    "p-6 rounded-2xl flex flex-col gap-4 transition-colors",
                    remaining.isNegative
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                        : "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                )}>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-tight">
                            {remaining.isNegative ? "Surplus reached" : "Remaining Today"}
                        </span>
                        <span className={cn(
                            "text-4xl font-extrabold tracking-tighter",
                            remaining.isNegative ? "text-emerald-500" : "text-red-500"
                        )}>
                            {remaining.isNegative ? formatSimple(Math.abs(remainingToday)) : formatSimple(remainingToday)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Worked</span>
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{formatSimple(workedToday)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Required</span>
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{formatSimple(requiredToday)}</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Total Section */}
                <div className={cn(
                    "p-6 rounded-2xl flex flex-col items-center gap-1 transition-colors",
                    monthly.isNegative
                        ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                        : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                )}>
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-tight">Monthly Balance</span>
                    <span className={cn(
                        "text-2xl font-extrabold tracking-tighter",
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
