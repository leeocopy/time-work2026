'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
        <div className="brutalist-card bg-white group">
            <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-black">
                        <BarChart3 className="w-8 h-8" />
                        PRODUCTIVITÉ
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        7 Dernières Sessions
                    </p>
                </div>
            </div>

            <div className="h-64 w-full bg-slate-50 border-2 border-black p-4 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#000', fontSize: 10, fontWeight: 900 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{
                                backgroundColor: '#000',
                                border: 'none',
                                color: '#fff',
                                fontWeight: '900',
                                fontSize: '10px',
                                textTransform: 'uppercase'
                            }}
                        />
                        <Bar
                            dataKey="hours"
                            fill="#BCFF00"
                            stroke="#000"
                            strokeWidth={2}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 border-2 border-black bg-brand-yellow shadow-[4px_4px_0px_#000]">
                    <div className="w-12 h-12 bg-black border-2 border-white flex items-center justify-center rotate-3">
                        <Zap className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xs font-black uppercase">Roi de la Constance</p>
                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">Série de 5 jours</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 border-2 border-black bg-brand-blue shadow-[4px_4px_0px_#000]">
                    <div className="w-12 h-12 bg-black border-2 border-white flex items-center justify-center -rotate-3">
                        <Trophy className="w-6 h-6 text-brand-blue" />
                    </div>
                    <div className="flex flex-col text-white">
                        <p className="text-xs font-black uppercase">Maître du Travail</p>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">42 heures au total</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
