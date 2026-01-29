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
    format
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
            const duration = (s.end.getTime() - s.start.getTime()) / 1000;
            totalWorked += duration;
            if (isToday(s.start)) dailyWorked += duration;
        });

        // Calculate expected time
        daysInMonth.forEach(day => {
            const isHoli = customHolidays.some(h => format(new Date(h.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            const isWE = isWeekend(day);
            const isWorkDay = !isHoli && !isWE;

            if (isWorkDay) {
                workDaysCount++;
                if (!isAfter(day, today)) {
                    passedWorkDays++;
                }
            }
        });

        const expectedSoFar = passedWorkDays * workGoal * 3600;
        const monthlyBalance = totalWorked - expectedSoFar;
        const dailyBalance = dailyWorked - (workGoal * 3600);

        return {
            monthlyBalance,
            dailyBalance,
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
                        CAPITAL FLOW
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Monthly Temporal Yield
                    </p>
                </div>
                <div className="btn-brutalist bg-white text-black py-1 px-4 text-xs shadow-[2px_2px_0px_#000]">
                    STABLE
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-black text-white p-6 border-4 border-white shadow-[10px_10px_0px_rgba(0,0,0,0.5)] -rotate-1 hover:rotate-0 transition-transform">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Net Balance</span>
                        <div className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase border-2",
                            stats.monthlyBalance >= 0 ? "bg-brand-lime text-black border-black shadow-[4px_4px_0px_#fff]" : "bg-brand-orange text-white border-white shadow-[4px_4px_0px_#000]"
                        )}>
                            {stats.monthlyBalance >= 0 ? 'Surplus' : 'Deficit'}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter tabular-nums">
                            {stats.monthlyBalance >= 0 ? '+' : ''}{formatHours(stats.monthlyBalance)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_#000]">
                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Today Flux</p>
                        <p className={cn(
                            "text-xl font-black tabular-nums",
                            stats.dailyBalance >= 0 ? "text-brand-blue" : "text-brand-orange"
                        )}>
                            {stats.dailyBalance >= 0 ? '+' : ''}{formatHours(stats.dailyBalance)}
                        </p>
                    </div>
                    <div className="bg-brand-yellow border-4 border-black p-4 shadow-[6px_6px_0px_#000]">
                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Total Yield</p>
                        <p className="text-xl font-black text-black tabular-nums">
                            {formatHours(stats.totalWorked)}
                        </p>
                    </div>
                </div>

                <div className="bg-white/10 border-2 border-white/20 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-black rounded-lg">
                                <Calendar className="w-4 h-4 text-brand-lime" />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-widest">Cycle Stats</span>
                        </div>
                        <span className="text-sm font-black text-white tabular-nums">
                            {stats.workDays} / {stats.totalDays} Days
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
