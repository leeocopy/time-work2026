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

    useEffect(() => {
        setMounted(true);
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
                const endTime = next ? new Date(next.timestamp) : new Date();
                workedMinutes += differenceInMinutes(endTime, new Date(current.timestamp));
            } else if (current.type === 'CHECK_OUT' && current.reason !== 'End of day') {
                const endTime = next ? new Date(next.timestamp) : new Date();
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
    }, [entries]);

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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 w-full">Today's Progress</h3>

            <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-indigo-600">{stats.pct}%</span>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Goal</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Worked</p>
                    <p className="text-lg font-bold text-indigo-600">{formatHours(stats.worked)}</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Breaks</p>
                    <p className="text-lg font-bold text-amber-500">{formatHours(stats.breaks)}</p>
                </div>
            </div>

            <div className="mt-4 w-full pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Daily Balance</span>
                <span className={`font-bold ${stats.worked >= (8.5 * 60) ? 'text-green-500' : 'text-zinc-400'}`}>
                    {stats.worked >= (8.5 * 60) ? 'Goal Met! 🎉' : `-${formatHours(stats.remaining)}`}
                </span>
            </div>
        </div>
    );
}
