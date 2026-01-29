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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s for live feel
        return () => clearInterval(timer);
    }, []);

    const getRequiredHoursForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (isWeekend(date) || PUBLIC_HOLIDAYS_2026.includes(dateStr)) return 0;
        const day = date.getDay(); // 0 is Sunday, 5 is Friday
        return day === 5 ? 7.5 : 8.5;
    };

    const { dailyPerformance, cumulativeBalance, todayGoal } = useMemo(() => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const requiredHoursToday = getRequiredHoursForDay(today);

        // --- 1. Today's Performance Calculation ---
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
        const dailyPerf = dailyHours - requiredHoursToday;

        // --- 2. Previous Days Balance (Carry-over) ---
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

        // Today's Total Goal = Required Today - CarryOver (if carryOver is -1h, we need +1h more, so 8.5 - (-1) = 9.5)
        const adjustedGoal = requiredHoursToday - carryOverBalance;

        return {
            dailyPerformance: dailyPerf,
            cumulativeBalance: carryOverBalance + dailyPerf,
            todayGoal: adjustedGoal > 0 ? adjustedGoal : 0
        };
    }, [entries, currentTime]);

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

    const formatHoursOnly = (hours: number) => {
        const mins = Math.round(hours * 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const perf = formatBalance(dailyPerformance);
    const cumulative = formatBalance(cumulativeBalance);

    return (
        <div className="bg-white dark:bg-zinc-900 px-6 py-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Balance Overview
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Resets every 1st of {format(new Date(), 'MMMM')}
                </p>
            </div>

            <div className="space-y-4">
                {/* Today's Goal (Adjusted) */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">Today's Target</span>
                        <span className="text-xs text-zinc-400 italic">Adjusted by previous days</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatHoursOnly(todayGoal)}
                    </span>
                </div>

                {/* Cumulative Balance Card (The one they care about most) */}
                <div className={cn(
                    "p-5 rounded-2xl flex flex-col items-center gap-1 transition-colors relative overflow-hidden",
                    cumulative.isNegative
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50"
                        : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50"
                )}>
                    <div className="absolute top-0 right-0 p-2">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", cumulative.isNegative ? "bg-red-500" : "bg-emerald-500")} />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">Month Balance</span>
                    <span className={cn(
                        "text-3xl font-extrabold tracking-tighter",
                        cumulative.isNegative ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                        {cumulative.text}
                    </span>
                </div>

                {/* Today's Performance */}
                <div className={cn(
                    "p-4 rounded-xl flex justify-between items-center",
                    perf.isNegative
                        ? "bg-zinc-100/50 dark:bg-zinc-800/30"
                        : "bg-emerald-50/50 dark:bg-emerald-900/10"
                )}>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">Today's Progress</span>
                    <span className={cn(
                        "text-sm font-bold",
                        perf.isNegative ? "text-zinc-600 dark:text-zinc-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                        {perf.text}
                    </span>
                </div>
            </div>
        </div>
    );
}
