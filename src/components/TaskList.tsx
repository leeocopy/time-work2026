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
        <div className="brutalist-card bg-white group">
            <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black italic flex items-center gap-3 text-black">
                        <ListTodo className="w-8 h-8" />
                        TÂCHES STRATÉGIQUES
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block w-fit mt-1">
                        Objectifs du Jour
                    </p>
                </div>
            </div>

            <form onSubmit={addTask} className="flex gap-3 mb-8">
                <input
                    type="text"
                    placeholder="AJOUTER UN OBJECTIF..."
                    className="flex-1 px-5 py-4 bg-slate-50 border-2 border-black outline-none text-xs font-black uppercase transition-all focus:bg-white placeholder:text-black/20"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <button type="submit" className="p-4 bg-brand-blue text-white border-2 border-black shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                    <Plus className="w-6 h-6" />
                </button>
            </form>

            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin">
                {tasks.map(task => (
                    <div key={task.id} className={cn(
                        "flex items-center gap-4 p-4 border-2 border-black transition-all",
                        task.completed ? "bg-slate-50 opacity-60" : "bg-white shadow-[4px_4px_0px_#000]"
                    )}>
                        <button
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                                "p-1 transition-colors",
                                task.completed ? "text-brand-lime" : "text-black/20 hover:text-black"
                            )}
                        >
                            {task.completed ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                        </button>
                        <span className={cn(
                            "text-sm font-black flex-1 transition-all uppercase italic",
                            task.completed ? 'line-through' : 'text-black'
                        )}>
                            {task.text}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="p-2 bg-brand-orange text-white border-2 border-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center gap-4 border-4 border-dashed border-black/10">
                        <div className="text-4xl grayscale opacity-30">⚡</div>
                        <p className="text-[11px] font-black text-black/30 uppercase tracking-[0.2em] px-4 italic leading-relaxed">
                            Horizon dégagé. Ajoutez votre premier objectif ci-dessus.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
