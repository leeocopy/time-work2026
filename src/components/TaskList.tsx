'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('today_tasks');
        if (saved) setTasks(JSON.parse(saved));
    }, []);

    const saveTasks = (list: Task[]) => {
        setTasks(list);
        localStorage.setItem('today_tasks', JSON.stringify(list));
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        const task = { id: Date.now().toString(), text: newTask, completed: false };
        saveTasks([...tasks, task]);
        setNewTask('');
    };

    const toggleTask = (id: string) => {
        saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        saveTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="glass-card hover-premium p-8 rounded-[2rem] flex flex-col">
            <div className="flex flex-col gap-1 mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight transition-colors">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                        <ListTodo className="w-5 h-5 text-indigo-500" />
                    </div>
                    Strategic Tasks
                </h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-10">Daily Objectives</p>
            </div>

            <form onSubmit={addTask} className="flex gap-3 mb-8">
                <input
                    type="text"
                    placeholder="Capture new objective..."
                    className="flex-1 px-5 py-4 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-zinc-400"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <button type="submit" className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95">
                    <Plus className="w-6 h-6" />
                </button>
            </form>

            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group hover:border-indigo-500/20 transition-all">
                        <button
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                                "p-1 rounded-lg transition-colors",
                                task.completed ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-300 hover:text-indigo-400"
                            )}
                        >
                            {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                        <span className={cn(
                            "text-sm font-bold flex-1 transition-all",
                            task.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'
                        )}>
                            {task.text}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-rose-500 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center gap-4 bg-zinc-50/30 dark:bg-white/[0.02] rounded-3xl border border-dashed border-zinc-200 dark:border-white/10">
                        <div className="text-3xl grayscale opacity-50">🏝️</div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4">Clear horizon. Add your first objective above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
