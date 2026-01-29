'use client';

import { Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatHours } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TimeEntry } from '@/lib/types';
import { isToday, startOfToday } from 'date-fns';

interface ProgressCardProps {
    entries: TimeEntry[];
    workGoal: number;
}

export default function ProgressCard({ entries, workGoal }: ProgressCardProps) {
    const calculateStats = () => {
        const today = startOfToday();
        const todayEntries = entries.filter(e => isToday(new Date(e.timestamp)));

        let worked = 0;
        let lastIn: Date | null = null;

        const sorted = [...todayEntries].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        sorted.forEach(entry => {
            if (entry.type === 'CHECK_IN') {
                lastIn = new Date(entry.timestamp);
            } else if (entry.type === 'CHECK_OUT' && lastIn) {
                worked += (new Date(entry.timestamp).getTime() - lastIn.getTime()) / 1000;
                lastIn = null;
            }
        });

        // Add live time if currently checked in
        const lastEntry = sorted[sorted.length - 1];
        if (lastEntry?.type === 'CHECK_IN') {
            worked += (new Date().getTime() - new Date(lastEntry.timestamp).getTime()) / 1000;
        }

        const goalSeconds = workGoal * 3600;
        const pct = (worked / goalSeconds) * 100;

        return {
            worked,
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
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-white">
                        <Activity className="w-8 h-8" />
                        LIVE METRICS
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-2 py-0.5 inline-block w-fit mt-1">
                        Node Capacity: {workGoal}H
                    </p>
                </div>
                <div className={cn(
                    "btn-brutalist py-1 px-4 text-xs transition-colors",
                    stats.isGoalReached ? "bg-brand-lime text-black border-white" : "bg-black text-white"
                )}>
                    {stats.isGoalReached ? 'MAXED' : 'OPTIMIZING'}
                </div>
            </div>

            <div className="flex flex-col items-center gap-10">
                <div className="relative w-44 h-44 bg-white border-4 border-black p-2 shadow-[8px_8px_0px_#000] flex-shrink-0 -rotate-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
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
                        <span className="text-3xl font-black text-black leading-none">{stats.pct}%</span>
                        <span className="text-[8px] font-black uppercase text-black/40">LOAD</span>
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-4">
                    <div className="bg-black text-white p-4 border-2 border-white/20 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-mint">Engaged</p>
                                <p className="text-2xl font-black tabular-nums">{formatHours(stats.worked)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Pending</p>
                                <p className="text-lg font-black tabular-nums text-white/60">{formatHours(stats.remaining)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/10 border-2 border-white/10 p-2.5">
                            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Sync Status</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", stats.isGoalReached ? "bg-brand-lime" : "bg-brand-yellow")} />
                                <span className="text-[9px] font-black text-white uppercase">{stats.isGoalReached ? 'Max' : 'Active'}</span>
                            </div>
                        </div>
                        <div className="bg-white/10 border-2 border-white/10 p-2.5">
                            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Ecliptic Flux</p>
                            <p className="text-[9px] font-black text-white uppercase mt-0.5">Quantum</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
