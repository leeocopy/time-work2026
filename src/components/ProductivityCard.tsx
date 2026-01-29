'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TimeEntry } from '@/lib/types';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInMinutes, format } from 'date-fns';
import { Trophy, Zap } from 'lucide-react';

interface ProductivityCardProps {
    entries: TimeEntry[];
}

export default function ProductivityCard({ entries }: ProductivityCardProps) {
    const chartData = useMemo(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayEntries = entries
                .filter(e => isSameDay(new Date(e.timestamp), day))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let workedMinutes = 0;
            for (let i = 0; i < dayEntries.length; i++) {
                const current = dayEntries[i];
                if (current.type === 'CHECK_IN') {
                    const next = dayEntries[i + 1];
                    const endTime = next ? new Date(next.timestamp) : (isSameDay(day, new Date()) ? new Date() : new Date(day.setHours(23, 59, 59)));
                    workedMinutes += differenceInMinutes(endTime, new Date(current.timestamp));
                }
            }

            return {
                day: format(day, 'EEE'),
                hours: Number((workedMinutes / 60).toFixed(1)),
                fullDate: format(day, 'MMM dd')
            };
        });
    }, [entries]);

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-full">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Productivity
            </h3>

            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f4f4f5' }}
                        />
                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.hours >= 8.5 ? '#4f46e5' : '#a5b4fc'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Achievements</h4>
                <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex flex-col items-center text-center">
                        <Trophy className="w-4 h-4 text-indigo-500 mb-1" />
                        <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-400">Streak</span>
                    </div>
                    <div className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex flex-col items-center text-center opacity-40">
                        <Zap className="w-4 h-4 text-zinc-400 mb-1" />
                        <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-400">Focus</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
