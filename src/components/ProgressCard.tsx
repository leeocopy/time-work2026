'use client';

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TimeEntry } from '@/lib/types';
import { differenceInMinutes, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface ProgressCardProps {
    entries: TimeEntry[];
}

export default function ProgressCard({ entries }: ProgressCardProps) {
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = useMemo(() => {
        if (!mounted) return { worked: 0, breaks: 0, remaining: 0, pct: '0.0' };
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        // Filter today's entries
        const todayEntries = entries
            .filter(e => isWithinInterval(new Date(e.timestamp), { start, end }))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let workedMinutes = 0;
        let breakMinutes = 0;
        const goalMinutes = 8.5 * 60; // 8.5 hours goal

        for (let i = 0; i < todayEntries.length; i++) {
            const current = todayEntries[i];
            const next = todayEntries[i + 1];

            if (current.type === 'CHECK_IN') {
                const endTime = next ? new Date(next.timestamp) : currentTime;
                workedMinutes += differenceInMinutes(endTime, new Date(current.timestamp));
            } else if (current.type === 'CHECK_OUT' && current.reason !== 'End of day') {
                const endTime = next ? new Date(next.timestamp) : currentTime;
                breakMinutes += differenceInMinutes(endTime, new Date(current.timestamp));
            }
        }

        const remainingMinutes = Math.max(0, goalMinutes - workedMinutes);

        return {
            worked: workedMinutes,
            breaks: breakMinutes,
            remaining: remainingMinutes,
            pct: Math.min(100, (workedMinutes / goalMinutes) * 100).toFixed(1)
        };
    }, [entries, mounted, currentTime]);

    const data = [
        { name: 'Worked', value: stats.worked, color: '#4f46e5' },
        { name: 'Breaks', value: stats.breaks, color: '#f59e0b' },
        { name: 'Remaining', value: stats.remaining, color: '#e4e4e7' }
    ];

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 w-full tracking-tight">Today's Progress</h3>

            <div className="w-full h-56 relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">{stats.pct}%</span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1">Daily Cap</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Worked</p>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatHours(stats.worked)}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Breaks</p>
                    <p className="text-xl font-black text-amber-500">{formatHours(stats.breaks)}</p>
                </div>
            </div>

            <div className="mt-8 w-full pt-6 border-t border-zinc-200/50 dark:border-white/5 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Net Status</span>
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mt-1">Daily Balance</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-sm font-black tracking-tight ${stats.worked >= (8.5 * 60) ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stats.worked >= (8.5 * 60) ? 'GOAL ACHIEVED 🎉' : `-${formatHours(stats.remaining)}`}
                    </span>
                </div>
            </div>
        </div>
    );
}
