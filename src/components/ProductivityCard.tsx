'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TimeEntry } from '@/lib/types';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInMinutes, format } from 'date-fns';
import { Trophy, Zap, BarChart3 } from 'lucide-react';

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
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight transition-colors font-display">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                    </div>
                    Productivity Heatmap
                </h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-10">Last 7 Sessions</p>
            </div>

            <div className="h-56 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 800 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Bar
                            dataKey="hours"
                            fill="url(#colorIndigo)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                        />
                        <defs>
                            <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="pt-6 border-t border-zinc-200/50 dark:border-white/5">
                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Career Achievements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">Consistency King</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">5 day streak</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">Deep Work Master</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">42 total hours</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
