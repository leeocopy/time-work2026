'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from 'lucide-react';

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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-full">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-500" />
                Today's Tasks
            </h3>

            <form onSubmit={addTask} className="flex gap-2 mb-6">
                <input
                    type="text"
                    placeholder="New task..."
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            <div className="space-y-2 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 group transition-all">
                        <button onClick={() => toggleTask(task.id)} className="text-indigo-600">
                            {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-zinc-300" />}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {task.text}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <p className="text-center text-zinc-400 text-sm italic py-8">No tasks for today. Chill out! 🍹</p>
                )}
            </div>
        </div>
    );
}
