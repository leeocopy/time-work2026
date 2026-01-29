'use client';

import { useMemo } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { cn, formatHours } from '@/lib/utils';
import { TimeEntry } from '@/lib/types';
import {
    isToday,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isWeekend,
    isAfter,
    startOfToday,
    format,
    isBefore,
    isSameDay
} from 'date-fns';
import { CustomHoliday } from './HolidayCard';

interface BalanceCardProps {
    entries: TimeEntry[];
    customHolidays: CustomHoliday[];
    workGoal: number;
}

export default function BalanceCard({ entries, customHolidays, workGoal }: BalanceCardProps) {
    const stats = useMemo(() => {
        const today = startOfToday();
        const startState = startOfMonth(today);
        const endState = endOfMonth(today);

        const daysInMonth = eachDayOfInterval({ start: startState, end: endState });

        let totalWorked = 0;
        let dailyWorked = 0;
        let workDaysCount = 0;
        let passedWorkDays = 0;
        let passedWorkDaysBeforeToday = 0;
        let isTodayWorkDay = false;

        // Calculate worked time
        const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const sessions: { start: Date, end: Date }[] = [];
        let currentStart: Date | null = null;

        sorted.forEach(e => {
            if (e.type === 'CHECK_IN') {
                currentStart = new Date(e.timestamp);
            } else if (e.type === 'CHECK_OUT' && currentStart) {
                sessions.push({ start: currentStart, end: new Date(e.timestamp) });
                currentStart = null;
            }
        });

        // Live session
        if (currentStart) {
            sessions.push({ start: currentStart, end: new Date() });
        }

        sessions.forEach(s => {
            const start = new Date(s.start);
            const duration = (s.end.getTime() - start.getTime()) / 1000;

            // Only count if session is in current month
            if (start >= startState && start <= endState) {
                totalWorked += duration;
                if (isToday(start)) dailyWorked += duration;
            }
        });

        // Calculate expected time
        daysInMonth.forEach(day => {
            const isHoli = customHolidays.some(h => format(new Date(h.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            const isWE = isWeekend(day);
            const isWorkDay = !isHoli && !isWE;

            if (isWorkDay) {
                workDaysCount++;
                if (isBefore(day, today)) {
                    passedWorkDaysBeforeToday++;
                }
                if (isSameDay(day, today)) {
                    isTodayWorkDay = true;
                }
                if (!isAfter(day, today)) {
                    passedWorkDays++;
                }
            }
        });

        const expectedToday = isTodayWorkDay ? (workGoal * 3600) : 0;
        const totalWorkedBeforeToday = totalWorked - dailyWorked;
        const expectedBeforeToday = passedWorkDaysBeforeToday * workGoal * 3600;

        const balanceBeforeToday = totalWorkedBeforeToday - expectedBeforeToday;
        const requiredToday = expectedToday - balanceBeforeToday;

        const dailyCompoundedBalance = dailyWorked - requiredToday;
        const monthlyBalance = totalWorked - (passedWorkDays * workGoal * 3600);

        return {
            monthlyBalance,
            dailyBalance: dailyCompoundedBalance,
            totalWorked,
            workDays: passedWorkDays,
            totalDays: workDaysCount
        };
    }, [entries, customHolidays, workGoal]);

    return (
        <div className="brutalist-card bg-slush-blue group">
            <div className="flex justify-between items-start mb-10">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-white">
                        <TrendingUp className="w-8 h-8" />
                        BALANCE OVERVIEW
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Your work hours balance.
                    </p>
                </div>
                <div className="btn-brutalist bg-white text-black py-1 px-4 text-xs shadow-[2px_2px_0px_#000]">
                    STABLE
                </div>
            </div>

            <div className="space-y-4">
                {/* Daily Balance Card */}
                <div className={cn(
                    "p-6 border-4 border-black shadow-[8px_8px_0px_#000] transition-all rotate-1 hover:rotate-0",
                    stats.dailyBalance >= 0 ? "bg-brand-lime" : "bg-brand-orange"
                )}>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60 mb-2">Daily Balance</span>
                        <span className="text-4xl font-black text-black tracking-tighter tabular-nums">
                            {stats.dailyBalance >= 0 ? '+' : ''}{formatHours(stats.dailyBalance)}
                        </span>
                    </div>
                </div>

                {/* Monthly Balance Card */}
                <div className={cn(
                    "p-6 border-4 border-black shadow-[8px_8px_0px_#000] transition-all -rotate-1 hover:rotate-0",
                    stats.monthlyBalance >= 0 ? "bg-brand-lime" : "bg-brand-orange"
                )}>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60 mb-2">Monthly Balance</span>
                        <span className="text-4xl font-black text-black tracking-tighter tabular-nums">
                            {stats.monthlyBalance >= 0 ? '+' : ''}{formatHours(stats.monthlyBalance)}
                        </span>
                    </div>
                </div>

                {/* Stats Footer */}
                <div className="bg-black text-white p-4 border-2 border-white/20 mt-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-brand-lime" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Cycle Stats</span>
                        </div>
                        <span className="text-xs font-black tabular-nums">
                            {stats.workDays} / {stats.totalDays} Days
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
