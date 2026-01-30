import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { PUBLIC_HOLIDAYS } from "./constants"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatHours(seconds: number): string {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = Math.floor(absSeconds % 60);
    return `${isNegative ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
export function getWorkGoal(date: Date): number {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isPublicHoliday = PUBLIC_HOLIDAYS.some(h => h.date === dateStr);
    if (isPublicHoliday) return 0;

    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    if (day === 0 || day === 6) return 0; // Weekend
    if (day === 5) return 7.5; // Friday 7h30
    return 8.5; // Monday-Thursday 8h30
}
