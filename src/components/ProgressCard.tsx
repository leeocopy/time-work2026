'use client';

import { Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatHours } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TimeEntry } from '@/lib/types';
import { isToday, startOfToday, format } from 'date-fns';

interface ProgressCardProps {
    entries: TimeEntry[];
    workGoal: number;
}

export default function ProgressCard({ entries, workGoal }: ProgressCardProps) {
    const calculateStats = () => {
        const todayEntries = entries.filter(e => isToday(new Date(e.timestamp)));
        const sorted = [...todayEntries].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let worked = 0;
        let totalBreak = 0;
        let lastIn: Date | null = null;
        let firstIn: Date | null = null;

        sorted.forEach((entry, index) => {
            const entryDate = new Date(entry.timestamp);
            if (entry.type === 'CHECK_IN') {
                if (!firstIn) firstIn = entryDate;
                lastIn = entryDate;

                // Calculate break time since last checkout
                if (index > 0) {
                    const prevEntry = sorted[index - 1];
                    if (prevEntry.type === 'CHECK_OUT') {
                        totalBreak += (entryDate.getTime() - new Date(prevEntry.timestamp).getTime()) / 1000;
                    }
                }
            } else if (entry.type === 'CHECK_OUT' && lastIn) {
                worked += (entryDate.getTime() - lastIn.getTime()) / 1000;
                lastIn = null;
            }
        });

        const now = new Date();
        const lastEntry = sorted[sorted.length - 1];

        // Live updates
        if (lastEntry?.type === 'CHECK_IN') {
            worked += (now.getTime() - new Date(lastEntry.timestamp).getTime()) / 1000;
        } else if (lastEntry?.type === 'CHECK_OUT' && (lastEntry.reason === 'Short break' || lastEntry.reason === 'Lunch break')) {
            totalBreak += (now.getTime() - new Date(lastEntry.timestamp).getTime()) / 1000;
        }

        const goalSeconds = workGoal * 3600;
        const pct = (worked / goalSeconds) * 100;
        const dailyBalance = worked - goalSeconds;

        // Leave Time: First Entry + Goal + Total Break
        let leaveTime: Date | null = null;
        const firstInDate = firstIn as Date | null;
        if (firstInDate) {
            leaveTime = new Date(firstInDate.getTime() + (workGoal * 3600 * 1000) + (totalBreak * 1000));
        }

        return {
            worked,
            totalBreak,
            dailyBalance,
            leaveTime,
            pct: Math.min(Math.round(pct), 100),
            remaining: Math.max(goalSeconds - worked, 0),
            isGoalReached: worked >= goalSeconds
        };
    };

    const stats = calculateStats();
    const data = [
        { name: 'Worked', value: stats.worked },
        { name: 'Remaining', value: stats.remaining }
    ];

    const COLORS = ['#BCFF00', 'rgba(255, 255, 255, 0.1)'];

    return (
        <div className="brutalist-card bg-slush-purple group h-full">
            <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black italic flex items-center gap-2 md:gap-3 text-white">
                        <Activity className="w-6 h-6 md:w-8 md:h-8" />
                        TODAY'S PROGRESS
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-2 py-0.5 inline-block w-fit mt-1">
                        Node Target: {workGoal}H
                    </p>
                </div>
                <div className={cn(
                    "btn-brutalist py-1 px-4 text-xs transition-colors",
                    stats.isGoalReached ? "bg-brand-lime text-black border-white" : "bg-black text-white"
                )}>
                    {stats.isGoalReached ? 'MAXED' : 'OPTIMIZING'}
                </div>
            </div>

            <div className="flex flex-col items-center gap-6 md:gap-10">
                <div className="relative w-36 h-36 md:w-44 md:h-44 bg-white border-4 border-black p-2 shadow-[6px_6px_0px_#000] md:shadow-[8px_8px_0px_#000] flex-shrink-0 -rotate-1 md:-rotate-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={false}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl md:text-3xl font-black text-black leading-none">{stats.pct}%</span>
                        <span className="text-[7px] md:text-[8px] font-black uppercase text-black/40">LOAD</span>
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-4">
                    <div className="bg-black text-white p-4 border-2 border-white/20 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                        <div className="grid grid-cols-2 gap-y-4">
                            <div>
                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-mint">Total Hours</p>
                                <p className="text-lg md:text-xl font-black tabular-nums">{formatHours(stats.worked)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/40">Daily Balance</p>
                                <p className={cn(
                                    "text-lg md:text-xl font-black tabular-nums",
                                    stats.dailyBalance >= 0 ? "text-brand-lime" : "text-brand-orange"
                                )}>
                                    {stats.dailyBalance >= 0 ? '+' : ''}{formatHours(stats.dailyBalance)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/40">Total Break</p>
                                <p className="text-base md:text-lg font-black tabular-nums text-white/60">{formatHours(stats.totalBreak)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/40">Leave Time</p>
                                <p className="text-base md:text-lg font-black tabular-nums text-white/60">
                                    {stats.leaveTime ? format(stats.leaveTime, 'HH:mm') : '--:--'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/10 border-2 border-white/10 p-2.5">
                            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Sync State</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", stats.isGoalReached ? "bg-brand-lime" : "bg-brand-yellow")} />
                                <span className="text-[9px] font-black text-white uppercase">{stats.isGoalReached ? 'Synced' : 'Active'}</span>
                            </div>
                        </div>
                        <div className="bg-white/10 border-2 border-white/10 p-2.5">
                            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Flow Type</p>
                            <p className="text-[9px] font-black text-white uppercase mt-0.5">Quantum</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
