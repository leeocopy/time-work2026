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
    customHolidays: any[];
}

const PUBLIC_HOLIDAYS_2026 = [
    '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
    '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25'
];

export default function BalanceCard({ entries, customHolidays }: BalanceCardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Live updates
        return () => clearInterval(timer);
    }, []);

    const holidayDates = useMemo(() => {
        return customHolidays.map(h => h.date);
    }, [customHolidays]);

    const getRequiredHoursForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Point 2 & 6: Expected hours = 0 if Holiday or Weekend
        if (isWeekend(date) || PUBLIC_HOLIDAYS_2026.includes(dateStr) || holidayDates.includes(dateStr)) {
            return 0;
        }

        // Point 1: Weekly target
        const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1
        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            return 8.5; // Monday to Thursday
        }
        if (dayOfWeek === 5) {
            return 7.5; // Friday
        }
        return 0;
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

                const dayHours = dayMillis / (1000 * 3600);
                // If it's a holiday (req=0), any dayHours is a bonus.
                balanceBeforeToday += (dayHours - req);
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
        <div className="glass-card hover-premium px-8 py-10 rounded-[2rem] flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Calendar className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight">
                        Balance Overview
                    </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest pl-11">
                    Performance Analytics
                </p>
            </div>

            <div className="space-y-6">
                {/* Daily Status Section */}
                <div className={cn(
                    "p-8 rounded-[1.5rem] flex flex-col gap-6 transition-all border",
                    remaining.isNegative
                        ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]"
                        : "bg-rose-500/[0.03] border-rose-500/20 shadow-[0_0_20px_-5px_rgba(244,63,94,0.1)]"
                )}>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                            {remaining.isNegative ? "Surplus reached" : "Remaining Today"}
                        </span>
                        <span className={cn(
                            "text-5xl font-black tracking-tighter drop-shadow-sm",
                            remaining.isNegative ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {remaining.isNegative ? formatSimple(Math.abs(remainingToday)) : formatSimple(remainingToday)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-200/30 dark:border-zinc-800/50">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Worked</span>
                            <span className="text-base font-extrabold">{formatSimple(workedToday)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Required</span>
                            <span className="text-base font-extrabold">{formatSimple(requiredToday)}</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Total Section */}
                <div className={cn(
                    "p-8 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all border",
                    monthly.isNegative
                        ? "bg-rose-500/[0.02] border-rose-500/10"
                        : "bg-emerald-500/[0.02] border-emerald-500/10"
                )}>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Monthly Balance</span>
                    <span className={cn(
                        "text-3xl font-black tracking-tighter",
                        monthly.isNegative ? "text-rose-500" : "text-emerald-500"
                    )}>
                        {monthly.text}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
                <p className="text-[10px] text-center text-zinc-400 uppercase font-black tracking-[0.3em]">
                    Resets {format(new Date(), 'MMMM')} 01
                </p>
            </div>
        </div>
    );
}
