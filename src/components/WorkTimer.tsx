"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './WorkTimer.module.css';

// --- Constants & Config ---
const BALANCE_THRESHOLD_MINUTES = 30;

type TimerState = 'IDLE' | 'WORKING' | 'ON_BREAK';
type BreakType = 'short' | 'lunch';

interface Break {
    id: string;
    start: number;
    end: number | null;
    type: BreakType;
}

interface Session {
    id: string;
    date: string; // YYYY-MM-DD (Local)
    start: number;
    end: number | null;
    breaks: Break[];
}

export interface Holiday {
    id: string; // date string YYYY-MM-DD for standard, uuid for custom
    date: string;
    name: string;
    isCustom: boolean;
}

// --- Calculation Utilities ---

const hhmmToMinutes = (hhmm: string): number => {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return (h * 60) + m;
};

const minutesToHHMM = (minutes: number): string => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    return `${isNegative ? '-' : '+'}${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m`;
};

const formatTimerMs = (ms: number): string => {
    const d = new Date(ms);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}h${m}m${s}s`;
};

/**
 * Calculates working minutes for a single session.
 */
const entryWorkedMinutes = (s: Session, currentTime: number): number => {
    const start = s.start;
    let end = s.end || currentTime;

    // Handle midnight crossing for logical timestamps
    if (end < start) {
        end += 24 * 60 * 60 * 1000;
    }

    const totalDurationMs = end - start;
    const totalBreakMs = s.breaks.reduce((acc, b) => {
        const bStart = b.start;
        let bEnd = b.end || (s.end ? s.end : currentTime);
        if (bEnd < bStart) bEnd += 24 * 60 * 60 * 1000;
        return acc + (bEnd - bStart);
    }, 0);

    return Math.max(0, Math.floor((totalDurationMs - totalBreakMs) / 60000));
};

const dailyWorkedMinutes = (sessions: Session[], currentTime: number): number => {
    return sessions.reduce((acc, s) => acc + entryWorkedMinutes(s, currentTime), 0);
};

// --- Holiday Utilities ---

const getEaster = (year: number) => {
    const f = Math.floor,
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
};

const getFranceHolidays = (year: number): Holiday[] => {
    const fixed = [
        { d: '01-01', n: 'New Year\'s Day' },
        { d: '05-01', n: 'Labour Day' },
        { d: '05-08', n: 'Victory Day' },
        { d: '07-14', n: 'Bastille Day' },
        { d: '08-15', n: 'Assumption' },
        { d: '11-01', n: 'All Saints\' Day' },
        { d: '11-11', n: 'Armistice Day' },
        { d: '12-25', n: 'Christmas Day' }
    ];

    const easter = getEaster(year);
    const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

    const easterMonday = addDays(easter, 1);
    const ascension = addDays(easter, 39);
    const pentecost = addDays(easter, 50);

    const variable = [
        { date: easterMonday, name: 'Easter Monday' },
        { date: ascension, name: 'Ascension Day' },
        { date: pentecost, name: 'Whit Monday' }
    ];

    const holidays: Holiday[] = [
        ...fixed.map(h => ({ id: `${year}-${h.d}`, date: `${year}-${h.d}`, name: h.n, isCustom: false })),
        ...variable.map(h => ({
            id: getLocalDateKey(h.date.getTime()),
            date: getLocalDateKey(h.date.getTime()),
            name: h.name,
            isCustom: false
        }))
    ];

    return holidays;
};

const getRequiredMinutesForDate = (dateStr: string, isHoliday: boolean = false) => {
    if (isHoliday) return 0;

    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

    // Sat / Sun = 0
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0;
    // Fri = 7h30 (450m)
    if (dayOfWeek === 5) return 450;
    // Mon-Thu = 8h30 (510m)
    return 510;
};

// --- Helpers ---

const getLocalDateKey = (ms?: number) => {
    const d = ms ? new Date(ms) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getLocalMonthKey = (ms?: number) => {
    const d = ms ? new Date(ms) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const safeJSONParse = <T,>(val: string | null, fallback: T): T => {
    if (!val) return fallback;
    try {
        return JSON.parse(val) as T;
    } catch (e) {
        return fallback;
    }
};

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9);
};

export default function WorkTimer() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    // --- State ---
    const [state, setState] = useState<TimerState>('IDLE');
    const [session, setSession] = useState<Session | null>(null);
    const [closedDays, setClosedDays] = useState<string[]>([]);
    const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
    const [allHistoricalSessions, setAllHistoricalSessions] = useState<Session[]>([]);

    const [now, setNow] = useState<number>(Date.now());
    const [selectedMonth, setSelectedMonth] = useState<string>(getLocalMonthKey());

    // Modal UI State
    const [manualFormOpen, setManualFormOpen] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        date: '',
        start: '',
        end: '',
        breaks: [] as { id: string, start: string, end: string, type: BreakType }[]
    });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Holiday State
    const [customHolidays, setCustomHolidays] = useState<Holiday[]>([]);
    const [disabledHolidays, setDisabledHolidays] = useState<string[]>([]); // Array of IDs
    const [addHolidayForm, setAddHolidayForm] = useState(false);
    const [holidayFormName, setHolidayFormName] = useState('');
    const [holidayFormDate, setHolidayFormDate] = useState('');

    // Weather & Prayer State
    const [weather, setWeather] = useState<{ temp: number, condition: string, humidity: number, feelsLike: number, code: number, updated: string } | null>(null);
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [nextPrayer, setNextPrayer] = useState<string | null>(null);
    const [timeToNextPrayer, setTimeToNextPrayer] = useState<string>('');

    const todayDateKey = getLocalDateKey();

    // --- Holiday Helpers (Memoized) ---
    const getActiveHolidays = useMemo(() => {
        const year = parseInt(selectedMonth.split('-')[0]);
        // Get for current year and previous/next to handle boundary cases if needed, 
        // but for now current selected year + stats is enough.
        // Actually historical calcs need ALL years.
        // For simplicity, we calculate on the fly for specific dates in the helpers,
        // but for the UI list we focus on selected year.
        return (targetYear: number) => {
            const standard = getFranceHolidays(targetYear);
            const custom = customHolidays.filter(h => h.date.startsWith(String(targetYear)));

            // Merge: custom overrides standard if same date? No, logic says user override wins.
            // If user adds a custom holiday on a date that is NOT a holiday, it becomes one.
            // If user disables a standard holiday, it is not one.

            const activeStandard = standard.filter(h => !disabledHolidays.includes(h.id));
            return [...activeStandard, ...custom];
        }
    }, [customHolidays, disabledHolidays, selectedMonth]);

    const isDateHoliday = useCallback((dateStr: string) => {
        const year = parseInt(dateStr.split('-')[0]);
        const standard = getFranceHolidays(year);
        const standardMatch = standard.find(h => h.date === dateStr);

        if (standardMatch) {
            return !disabledHolidays.includes(standardMatch.id);
        }

        return customHolidays.some(h => h.date === dateStr);
    }, [customHolidays, disabledHolidays]);

    const getHolidayDetails = useCallback((dateStr: string) => {
        const year = parseInt(dateStr.split('-')[0]);
        const standard = getFranceHolidays(year);
        const standardMatch = standard.find(h => h.date === dateStr);
        if (standardMatch && !disabledHolidays.includes(standardMatch.id)) return standardMatch;
        return customHolidays.find(h => h.date === dateStr);
    }, [customHolidays, disabledHolidays]);

    // --- Effects ---

    // Weather Fetch (Marrakech)
    useEffect(() => {
        const fetchWeather = async () => {
            const d = new Date();
            const nowTime = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}m`;
            try {
                // Open-Meteo for Marrakech (31.63, -8.00)
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=31.63&longitude=-8.00&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=auto');
                if (!res.ok) throw new Error('Weather fetch failed');
                const data = await res.json();

                setWeather({
                    temp: Math.round(data.current.temperature_2m),
                    humidity: data.current.relative_humidity_2m,
                    feelsLike: Math.round(data.current.apparent_temperature),
                    code: data.current.weather_code,
                    condition: getWeatherCondition(data.current.weather_code),
                    updated: nowTime
                });
            } catch (e) {
                console.error("Weather Error:", e);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 20 * 60 * 1000); // 20 mins
        return () => clearInterval(interval);
    }, []);

    // Prayer Fetch (Marrakech)
    useEffect(() => {
        const fetchPrayer = async () => {
            try {
                const d = new Date();
                const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                // Method 21: Morocco (Ministry of Habous)
                const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=Marrakech&country=Morocco&method=21`);
                if (!res.ok) throw new Error('Prayer fetch failed');
                const data = await res.json();
                setPrayerTimes(data.data.timings);

                // Calc next prayer
                const timings = data.data.timings;
                const nowMinutes = d.getHours() * 60 + d.getMinutes();
                const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                let next = null;
                for (const p of prayerOrder) {
                    const t = timings[p];
                    const [h, m] = t.split(':').map(Number);
                    const pMin = h * 60 + m;
                    if (pMin > nowMinutes) {
                        next = p;
                        break;
                    }
                }
                if (!next) next = 'Fajr'; // Next day
                setNextPrayer(next);

            } catch (e) { console.error("Prayer Error:", e); }
        };
        fetchPrayer();
        // Check once an hour or on mount
        const interval = setInterval(fetchPrayer, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (!prayerTimes) return;

        const updateCountdown = () => {
            const now = new Date();
            const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
            let nextP = null;
            let nextTime = null;

            for (const p of prayerOrder) {
                const [h, m] = prayerTimes[p].split(':').map(Number);
                const pDate = new Date();
                pDate.setHours(h, m, 0, 0);
                if (pDate > now) {
                    nextP = p;
                    nextTime = pDate;
                    break;
                }
            }

            if (!nextP) {
                // Next is Fajr tomorrow
                nextP = 'Fajr';
                const [h, m] = prayerTimes['Fajr'].split(':').map(Number);
                const pDate = new Date();
                pDate.setDate(pDate.getDate() + 1);
                pDate.setHours(h, m, 0, 0);
                nextTime = pDate;
            }

            setNextPrayer(nextP);

            if (nextTime) {
                const diff = nextTime.getTime() - now.getTime();
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeToNextPrayer(`${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`);
            }
        };

        const interval = setInterval(updateCountdown, 1000);
        updateCountdown();
        return () => clearInterval(interval);
    }, [prayerTimes]);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const { data: { session: authSession } } = await supabase.auth.getSession();

        let history: Session[] = [];
        let activeSess: Session | null = null;
        let currentState: TimerState = 'IDLE';

        if (authSession) {
            setUser(authSession.user);

            // Fetch from Supabase
            const { data: remoteSessions, error: sessError } = await supabase
                .from('sessions')
                .select(`
                    *,
                    breaks (*)
                `)
                .order('start_time', { ascending: false });

            if (!sessError && remoteSessions) {
                history = remoteSessions.map(rs => ({
                    id: rs.id,
                    date: rs.work_date,
                    start: new Date(rs.start_time).getTime(),
                    end: rs.end_time ? new Date(rs.end_time).getTime() : null,
                    breaks: rs.breaks.map((rb: any) => ({
                        id: rb.id,
                        start: new Date(rb.start_time).getTime(),
                        end: rb.end_time ? new Date(rb.end_time).getTime() : null,
                        type: rb.break_type
                    }))
                }));

                // Auto-detect active session (NULL end_time)
                const remoteActive = history.find(s => s.end === null);
                if (remoteActive) {
                    activeSess = remoteActive;
                    currentState = remoteActive.breaks.some(b => b.end === null) ? 'ON_BREAK' : 'WORKING';
                }
            }
        }

        // Migration/Backup
        if (history.length === 0) {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('workTimer_sessions_'));
            keys.forEach(k => {
                history = history.concat(safeJSONParse<Session[]>(localStorage.getItem(k), []));
            });
        }

        setAllHistoricalSessions(history);
        setSession(activeSess);
        setState(currentState);

        const savedClosedDays = localStorage.getItem('workTimer_closedDays');
        if (savedClosedDays) setClosedDays(safeJSONParse<string[]>(savedClosedDays, []));
        const savedCustomHolidays = localStorage.getItem('workTimer_customHolidays');
        if (savedCustomHolidays) setCustomHolidays(safeJSONParse<Holiday[]>(savedCustomHolidays, []));
        const savedDisabledHolidays = localStorage.getItem('workTimer_disabledHolidays');
        if (savedDisabledHolidays) setDisabledHolidays(safeJSONParse<string[]>(savedDisabledHolidays, []));
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const filtered = allHistoricalSessions.filter(s => s.date.startsWith(selectedMonth) && s.end !== null);
        setCompletedSessions(filtered);
    }, [selectedMonth, allHistoricalSessions]);

    // Simplified effect for metadata
    useEffect(() => {
        // No local storage sync for state/session anymore
    }, [state, session]);

    useEffect(() => {
        localStorage.setItem('workTimer_closedDays', JSON.stringify(closedDays));
    }, [closedDays]);

    useEffect(() => {
        localStorage.setItem('workTimer_customHolidays', JSON.stringify(customHolidays));
    }, [customHolidays]);

    useEffect(() => {
        localStorage.setItem('workTimer_disabledHolidays', JSON.stringify(disabledHolidays));
    }, [disabledHolidays]);

    // --- Handlers ---

    const handleCheckIn = async (forcedStartTime?: number) => {
        const currentMonth = getLocalMonthKey();
        if (selectedMonth !== currentMonth) setSelectedMonth(currentMonth);

        const startTime = forcedStartTime || Date.now();
        const newSession: Session = {
            id: generateId(),
            date: todayDateKey,
            start: startTime,
            end: null,
            breaks: []
        };

        // Sync to Supabase
        if (user) {
            const { error } = await supabase.from('sessions').insert({
                id: newSession.id,
                user_id: user.id,
                work_date: todayDateKey,
                start_time: new Date(startTime).toISOString()
            });
            if (error) console.error("Error syncing check-in:", error);
        }

        setSession(newSession);
        setState('WORKING');
    };

    const toggleBreak = async (type: BreakType) => {
        if (!session) return;
        const nowMs = Date.now();

        if (state === 'WORKING') {
            const newBreak: Break = { id: generateId(), start: nowMs, end: null, type };

            // Sync to Supabase
            if (user) {
                const { error } = await supabase.from('breaks').insert({
                    id: newBreak.id,
                    session_id: session.id,
                    break_type: type,
                    start_time: new Date(nowMs).toISOString()
                });
                if (error) console.error("Error syncing break start:", error);
            }

            setSession({ ...session, breaks: [...session.breaks, newBreak] });
            setState('ON_BREAK');
        } else if (state === 'ON_BREAK') {
            const activeBreak = session.breaks.find(b => b.end === null);
            if (activeBreak?.type === type) {
                const updatedBreaks = session.breaks.map(b => b.end === null ? { ...b, end: nowMs } : b);

                // Sync to Supabase
                if (user && activeBreak) {
                    const { error } = await supabase.from('breaks')
                        .update({ end_time: new Date(nowMs).toISOString() })
                        .eq('id', activeBreak.id);
                    if (error) console.error("Error syncing break end:", error);
                }

                setSession({ ...session, breaks: updatedBreaks });
                setState('WORKING');
            }
        }
    };

    const handleCheckOut = async () => {
        if (!session) return;
        const nowMs = Date.now();
        let sessionToSave = { ...session };

        if (state === 'ON_BREAK') {
            const activeBreak = sessionToSave.breaks.find(b => b.end === null);
            if (activeBreak && user) {
                await supabase.from('breaks').update({ end_time: new Date(nowMs).toISOString() }).eq('id', activeBreak.id);
            }
        }

        // Sync to Supabase
        if (user) {
            const { error } = await supabase.from('sessions')
                .update({ end_time: new Date(nowMs).toISOString() })
                .eq('id', session.id);
            if (error) console.error("Error syncing check-out:", error);
        }

        // Final UI Reset and Refresh
        setSession(null);
        setState('IDLE');
        await loadData();
    };

    const handleEndOfDay = () => {
        if (session) handleCheckOut();
        else setState('IDLE');
        setClosedDays(prev => prev.includes(todayDateKey) ? prev : [...prev, todayDateKey]);
    };


    const deleteSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        if (user) {
            const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
            if (error) {
                console.error("Error deleting session:", error);
                return;
            }
        }
        await loadData();
    };

    // --- Statistics & Calculations ---

    const todayCalculations = useMemo(() => {
        const sessions = allHistoricalSessions.filter(s => s.date === todayDateKey);
        const isActive = session && session.date === todayDateKey;
        const workedToday = dailyWorkedMinutes(sessions, isActive ? now : 0) + (isActive ? entryWorkedMinutes(session!, now) : 0);
        const requiredToday = getRequiredMinutesForDate(todayDateKey, isDateHoliday(todayDateKey));

        let hasActivity = (sessions.length > 0 || isActive);
        if (!hasActivity) hasActivity = null; // Differentiate 0 from null

        const isClosed = closedDays.includes(todayDateKey);

        // Today's Balance
        // If no activity yet, balance is technically -Required.
        // But for UX, we might show "0" or "--" until they start.
        // Let's store "Real Balance" vs "Display Balance"
        const realTodayBalance = workedToday - requiredToday;

        // If 0 worked and day not over, showing huge negative balance is discouraging.
        // We'll trust the UI to handle the display logic (showing -- or negative).
        const displayTodayBalance = realTodayBalance;

        const breakMs = sessions.reduce((acc, s) => acc + s.breaks.reduce((ba, b) => ba + ((b.end || (s.end ? s.end : now)) - b.start), 0), 0)
            + (isActive ? session!.breaks.reduce((ba, b) => ba + ((b.end || now) - b.start), 0) : 0);

        const workPct = requiredToday > 0 ? (workedToday / requiredToday) * 100 : 0;

        return {
            workedToday,
            requiredToday,
            realTodayBalance,
            displayTodayBalance,
            breakMin: Math.floor(breakMs / 60000),
            isClosed,
            hasActivity,
            isHoliday: isDateHoliday(todayDateKey),
            holidayDetails: getHolidayDetails(todayDateKey),
            workPct
        };
    }, [allHistoricalSessions, session, todayDateKey, now, closedDays, isDateHoliday, getHolidayDetails]);

    const historicalCalculations = useMemo(() => {
        // CarryOverBeforeToday = sum(dailyBalance for all days before today)
        const otherDays = Array.from(new Set([
            ...allHistoricalSessions.filter(s => s.date !== todayDateKey).map(s => s.date),
            ...closedDays.filter(d => d !== todayDateKey)
        ])).sort();

        let carryOverMin = 0;
        otherDays.forEach(date => {
            const dayWorked = dailyWorkedMinutes(allHistoricalSessions.filter(s => s.date === date), 0);
            const isHol = isDateHoliday(date);
            const dayReq = getRequiredMinutesForDate(date, isHol);
            // Only add to balance if:
            // 1. It's a standard workday and missed (dayReq > 0)
            // 2. OR it was a day with activity (dayWorked > 0) and we want to count positive balance

            // Logic check:
            // If Holiday: Req=0. If worked 0, Bal=0. If worked 120, Bal=+120.
            // If Workday: Req=510. If worked 0, Bal=-510.
            carryOverMin += (dayWorked - dayReq);
        });

        // Total Cumulative Balance (All-time)
        const allHistoricalBalance = carryOverMin + todayCalculations.realTodayBalance;

        // Total Balance (Display) - uses the "UX-smoothed" today balance
        const totalDisplayBalance = carryOverMin + todayCalculations.displayTodayBalance;

        return { carryOverMin, allHistoricalBalance, totalDisplayBalance };
    }, [allHistoricalSessions, closedDays, todayDateKey, todayCalculations.realTodayBalance, todayCalculations.displayTodayBalance, isDateHoliday]);

    const monthStats = useMemo(() => {
        const monthPrefix = selectedMonth;
        const sessions = allHistoricalSessions.filter(s => s.date.startsWith(monthPrefix));
        const workedMs = sessions.reduce((acc, s) => acc + entryWorkedMinutes(s, s.end || now), 0) * 60000;
        const breakMs = sessions.reduce((acc, s) => acc + s.breaks.reduce((ba, b) => ba + ((b.end || (s.end ? s.end : now)) - b.start), 0), 0);

        // Required minutes for the selected month
        const [y, m] = selectedMonth.split('-').map(Number);
        let requiredMin = 0;
        const daysInMonth = new Date(y, m, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateC = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            requiredMin += getRequiredMinutesForDate(dateC, isDateHoliday(dateC));
        }

        return {
            workedMs,
            breakMs,
            requiredMin,
            balanceMin: Math.floor(workedMs / 60000) - requiredMin,
            hasData: sessions.length > 0
        };
    }, [allHistoricalSessions, selectedMonth, now, isDateHoliday]);

    // --- Holiday Handlers ---
    const handleAddHoliday = () => {
        if (!holidayFormName || !holidayFormDate) return;
        const newHol: Holiday = {
            id: generateId(),
            date: holidayFormDate,
            name: holidayFormName,
            isCustom: true
        };
        setCustomHolidays([...customHolidays, newHol]);
        setAddHolidayForm(false);
        setHolidayFormName('');
        setHolidayFormDate('');
    };

    const toggleHolidayDisable = (hol: Holiday) => {
        if (hol.isCustom) {
            // Delete custom
            setCustomHolidays(customHolidays.filter(h => h.id !== hol.id));
        } else {
            // Toggle disable standard
            if (disabledHolidays.includes(hol.id)) {
                setDisabledHolidays(disabledHolidays.filter(id => id !== hol.id));
            } else {
                setDisabledHolidays([...disabledHolidays, hol.id]);
            }
        }
    };

    // --- Modal Handlers ---

    const handleSaveManual = async () => {
        const startMs = timeToMs(formData.start, formData.date);
        let endMs = timeToMs(formData.end, formData.date);
        if (endMs < startMs) endMs += 24 * 60 * 60 * 1000;

        const newSession: Session = {
            id: editingId || generateId(),
            date: formData.date,
            start: startMs,
            end: endMs,
            breaks: formData.breaks.map(b => {
                let bStart = timeToMs(b.start, formData.date);
                let bEnd = timeToMs(b.end, formData.date);
                if (bStart < startMs) bStart += 24 * 60 * 60 * 1000;
                if (bEnd < bStart) bEnd += 24 * 60 * 60 * 1000;
                return { id: b.id || generateId(), type: b.type, start: bStart, end: bEnd };
            })
        };

        if (editingId) {
            const old = allHistoricalSessions.find(s => s.id === editingId);
            if (old && old.date !== newSession.date) {
                // If date changed, we need to ensure we don't have duplicates or mismatched date-keys
                // But the ID is the same, so Supabase will just update it. 
                // However, deleteSession has a confirmation, so let's just let the upsert handle it.
            }
        }

        // Sync to Supabase
        if (user) {
            // Upsert Session
            const { error: sErr } = await supabase.from('sessions').upsert({
                id: newSession.id,
                user_id: user.id,
                work_date: newSession.date,
                start_time: new Date(newSession.start).toISOString(),
                end_time: new Date(newSession.end!).toISOString()
            });

            if (!sErr) {
                // Delete existing breaks for this session and re-insert
                await supabase.from('breaks').delete().eq('session_id', newSession.id);
                if (newSession.breaks.length > 0) {
                    await supabase.from('breaks').insert(
                        newSession.breaks.map(b => ({
                            id: b.id,
                            session_id: newSession.id,
                            break_type: b.type,
                            start_time: new Date(b.start).toISOString(),
                            end_time: new Date(b.end!).toISOString()
                        }))
                    );
                }
            }
        }

        await loadData();
        setManualFormOpen(false);
    };

    const timeToMs = (hhmm: string, dateBaseStr: string) => {
        if (!hhmm) return 0;
        const [h, m] = hhmm.split(':').map(Number);
        const [y, mm, d] = dateBaseStr.split('-').map(Number);
        const date = new Date(y, mm - 1, d);
        date.setHours(h, m, 0, 0);
        return date.getTime();
    };

    const msToHHMM = (ms: number) => {
        const d = new Date(ms);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };

    const openEdit = (s: Session) => {
        setEditingId(s.id);
        setFormData({
            date: s.date,
            start: msToHHMM(s.start),
            end: s.end ? msToHHMM(s.end) : msToHHMM(now),
            breaks: s.breaks.map(b => ({
                id: b.id,
                start: msToHHMM(b.start),
                end: b.end ? msToHHMM(b.end) : msToHHMM(now),
                type: b.type
            }))
        });
        setValidationErrors([]);
        setManualFormOpen(true);
    };

    // --- View Sort ---

    const sortedGroups = useMemo(() => {
        const grouped: Record<string, Session[]> = {};
        allHistoricalSessions.filter(s => s.date.startsWith(selectedMonth)).forEach(s => {
            if (!grouped[s.date]) grouped[s.date] = [];
            grouped[s.date].push(s);
        });
        return Object.keys(grouped).sort().reverse().map(date => ({
            date,
            sessions: grouped[date].sort((a, b) => b.start - a.start)
        }));
    }, [allHistoricalSessions, selectedMonth]);

    const activeBreak = session?.breaks.find(b => b.end === null);

    // --- Productivity Analytics ---

    const analyticsData = useMemo(() => {
        // 1. Weekly Work
        const today = new Date(now);
        const dayOfWeek = today.getDay(); // 0Sun - 6Sat
        const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMon);
        monday.setHours(0, 0, 0, 0);

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            weekDays.push(getLocalDateKey(d.getTime()));
        }

        let maxWorked = 0;
        let totalWorkedWeek = 0;
        let daysWorkedCount = 0;
        let totalBreakWeek = 0;

        const dailyStats = weekDays.map(dateStr => {
            const sessions = allHistoricalSessions.filter(s => s.date === dateStr);
            const isToday = dateStr === todayDateKey;

            // If today, include active session
            let dayWorked = dailyWorkedMinutes(sessions, isToday ? now : 0);
            if (isToday && session) dayWorked += entryWorkedMinutes(session, now);

            let dayBreak = sessions.reduce((acc, s) => acc + s.breaks.reduce((ba, b) => ba + ((b.end || (s.end ? s.end : now)) - b.start), 0), 0);
            if (isToday && session) {
                dayBreak += session.breaks.reduce((ba, b) => ba + ((b.end || now) - b.start), 0);
            }
            const dayBreakMin = Math.floor(dayBreak / 60000);

            if (dayWorked > maxWorked) maxWorked = dayWorked;
            if (dayWorked > 0) daysWorkedCount++;

            totalWorkedWeek += dayWorked;
            totalBreakWeek += dayBreakMin;

            return {
                date: dateStr,
                dayName: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' }),
                worked: dayWorked,
                break: dayBreakMin,
                required: getRequiredMinutesForDate(dateStr, isDateHoliday(dateStr)),
                balance: dayWorked - getRequiredMinutesForDate(dateStr, isDateHoliday(dateStr)),
                isToday
            };
        });

        const weeklyAvg = daysWorkedCount > 0 ? Math.floor(totalWorkedWeek / daysWorkedCount) : 0;

        // Find most/least productive days
        const sortedByWork = [...dailyStats].filter(d => d.worked > 0).sort((a, b) => b.worked - a.worked);
        const mostProductive = sortedByWork.length > 0 ? sortedByWork[0].dayName : '-';
        const leastProductive = sortedByWork.length > 0 ? sortedByWork[sortedByWork.length - 1].dayName : '-';

        // 2. Achievements
        const achievements = {
            earlyBird: false,
            consistency: false, // 3 days in a row met target
            focusMaster: false  // Break < 10% of worked (today or week average?) -> Let's do Week Average
        };

        // Early Bird: Checked in before 9:00 AM today
        if (session && session.date === todayDateKey) {
            const startHour = new Date(session.start).getHours();
            if (startHour < 9) achievements.earlyBird = true;
        } else {
            // Check history for today
            const firstToday = allHistoricalSessions.filter(s => s.date === todayDateKey).sort((a, b) => a.start - b.start)[0];
            if (firstToday) {
                const startHour = new Date(firstToday.start).getHours();
                if (startHour < 9) achievements.earlyBird = true;
            }
        }

        // Consistency: Check if last 3 days (including today if met) met target
        // We look at the last 3 entries in dailyStats that are NOT future (worked > 0 or isToday or isPast)
        // Simplified: just check if 3 consecutive days in dailyStats met target
        let streak = 0;
        let maxStreak = 0;
        dailyStats.forEach(d => {
            if (d.worked >= d.required && d.required > 0) streak++;
            else streak = 0;
            if (streak > maxStreak) maxStreak = streak;
        });
        if (maxStreak >= 3) achievements.consistency = true;

        // Focus Master: Total Break < 10% of Total Work (Week)
        if (totalWorkedWeek > 60 && totalBreakWeek < (totalWorkedWeek * 0.1)) {
            achievements.focusMaster = true;
        }

        // 3. Work vs Break Donut
        const totalTime = totalWorkedWeek + totalBreakWeek;
        const workPct = totalTime > 0 ? (totalWorkedWeek / totalTime) * 100 : 0;
        const breakPct = totalTime > 0 ? (totalBreakWeek / totalTime) * 100 : 0;

        return {
            dailyStats,
            maxWorked: Math.max(maxWorked, 600), // Min max 10h for scale
            totalWorkedWeek,
            weeklyAvg,
            mostProductive,
            leastProductive,
            achievements,
            workPct,
            breakPct
        };
    }, [allHistoricalSessions, session, now, todayDateKey, isDateHoliday]);

    // Calendar Data for UI
    const calendarDays = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const firstDayDow = new Date(y, m - 1, 1).getDay(); // 0Sun

        // Adjust for Mon start (0->6, 1->0)
        const startOffset = firstDayDow === 0 ? 6 : firstDayDow - 1;

        const days = [];
        // Empty slots
        for (let i = 0; i < startOffset; i++) days.push(null);
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                day: d,
                isToday: dateStr === todayDateKey,
                isHoliday: isDateHoliday(dateStr),
                holiday: getHolidayDetails(dateStr)
            });
        }
        return days;
    }, [selectedMonth, todayDateKey, isDateHoliday, getHolidayDetails]);

    const getWeatherCondition = (code: number) => {
        const map: Record<number, string> = {
            0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing Rime Fog',
            51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
            61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
            80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
            95: 'Thunderstorm'
        };
        return map[code] || 'Unknown';
    };

    const getWeatherIcon = (code: number) => {
        if (code === 0) return '☀️';
        if (code <= 3) return '🌤️';
        if (code <= 48) return '🌫️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 86) return '🌨️';
        return '⛈️';
    };

    const activeHolidaysList = useMemo(() => {
        const y = parseInt(selectedMonth.split('-')[0]);
        const all = getActiveHolidays(y);
        const m = selectedMonth.split('-')[1];
        return all.filter(h => h.date.startsWith(`${y}-${m}`));
    }, [selectedMonth, getActiveHolidays]);


    return (
        <div className={styles.dashboard}>
            {/* Top Header */}
            <header className={styles.topBar}>
                <div className={styles.appTitle}>
                    <span>⏱️</span> Work Hours Calculator
                </div>
                <div className={styles.userActions}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        {user?.email}
                    </span>
                    <button
                        className={styles.btnSecondary}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                    >
                        Sign Out
                    </button>
                    <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.6rem' }}>⚙️</button>
                </div>
            </header>

            <div className={styles.mainGrid}>
                {/* --- LEFT COLUMN --- */}
                <div className={styles.column}>
                    {/* 1. Time Tracker */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Global Clock</div>

                        <div className={styles.timerSection}>
                            <div className={`${styles.statusBadge} ${state === 'IDLE' ? styles.statusIdle :
                                state === 'WORKING' ? styles.statusWorking :
                                    styles.statusBreak
                                }`}>
                                {state === 'IDLE' ? 'Ready to Work' :
                                    state === 'WORKING' ? 'System Active' :
                                        `Break • ${activeBreak?.type === 'lunch' ? 'Lunch' : 'Short'}`}
                            </div>

                            <div className={styles.timerDisplay}>
                                {formatTimerMs(now)}
                            </div>

                            <div className={styles.controls}>
                                {state === 'IDLE' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                                        <button className={`${styles.button} ${styles.btnPrimary}`} onClick={() => handleCheckIn()}>
                                            System Check-In
                                        </button>
                                        <div className={styles.controlGrid}>
                                            <button
                                                className={`${styles.button} ${styles.btnSecondary}`}
                                                style={{ fontSize: '0.75rem', padding: '0.6rem' }}
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setHours(8, 0, 0, 0);
                                                    handleCheckIn(d.getTime());
                                                }}
                                            >
                                                🚀 08:00 Start
                                            </button>
                                            <button
                                                className={`${styles.button} ${styles.btnSecondary}`}
                                                style={{ fontSize: '0.75rem', padding: '0.6rem' }}
                                                onClick={async () => {
                                                    const d = new Date();
                                                    const start = new Date(d); start.setHours(8, 0, 0, 0);
                                                    const end = new Date(d); end.setHours(17, 0, 0, 0);
                                                    const lunchS = new Date(d); lunchS.setHours(12, 0, 0, 0);
                                                    const lunchE = new Date(d); lunchE.setHours(13, 0, 0, 0);

                                                    const sessionId = generateId();
                                                    if (user) {
                                                        const { error: sErr } = await supabase.from('sessions').insert({
                                                            id: sessionId, user_id: user.id, work_date: todayDateKey,
                                                            start_time: start.toISOString(), end_time: end.toISOString()
                                                        });
                                                        if (!sErr) {
                                                            await supabase.from('breaks').insert({
                                                                session_id: sessionId, break_type: 'lunch',
                                                                start_time: lunchS.toISOString(), end_time: lunchE.toISOString()
                                                            });
                                                        }
                                                    }
                                                    loadData();
                                                }}
                                            >
                                                📋 Log 08-17
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button className={`${styles.button} ${styles.btnPrimary}`} onClick={handleCheckOut} style={{ marginBottom: '0.25rem' }}>
                                            Complete Session
                                        </button>
                                        <div className={styles.controlGrid}>
                                            <button className={`${styles.button} ${styles.btnSecondary}`}
                                                onClick={() => toggleBreak('short')}
                                                disabled={state === 'ON_BREAK' && activeBreak?.type !== 'short'}>
                                                {state === 'ON_BREAK' && activeBreak?.type === 'short' ? 'Resume' : '☕ Pause'}
                                            </button>
                                            <button className={`${styles.button} ${styles.btnSecondary}`}
                                                onClick={() => toggleBreak('lunch')}
                                                disabled={state === 'ON_BREAK' && activeBreak?.type !== 'lunch'}>
                                                {state === 'ON_BREAK' && activeBreak?.type === 'lunch' ? 'Resume' : '🍔 Lunch'}
                                            </button>
                                        </div>
                                        <button className={`${styles.button}`} onClick={handleEndOfDay} style={{ marginTop: '0.25rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger)' }}>
                                            End of Day
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3b. Weather */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle} style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Marrakech</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{weather?.updated || '--:--'}</span>
                        </div>

                        {weather ? (
                            <div className={styles.weatherContainer}>
                                <div className={styles.weatherMain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                    <div style={{ fontSize: '2.5rem' }}>{getWeatherIcon(weather.code)}</div>
                                    <div className={styles.weatherTemp}>{weather.temp}°</div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{weather.condition}</div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Humidity</span>
                                        <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{weather.humidity}%</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Feels Like</span>
                                        <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{weather.feelsLike}°</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.loaderText}>
                                Loading weather...
                            </div>
                        )}
                    </div>

                    {/* 3c. Prayer Times */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Prayer Times</div>

                        {prayerTimes ? (
                            <>
                                <div className={styles.countdownContainer}>
                                    <div className={styles.kdIcon}>K</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Next: {nextPrayer} in</div>
                                    <div className={styles.countdownTime}>{timeToNextPrayer}</div>
                                </div>

                                <div className={styles.prayerList}>
                                    {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
                                        <div key={p} className={`${styles.prayerRow} ${nextPrayer === p ? styles.next : ''}`}>
                                            <span>{p}</span>
                                            <span>{prayerTimes[p]}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.duaContainer}>
                                    <div className={styles.duaArabic}>
                                        "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا"
                                    </div>
                                    <div className={styles.duaTranslate}>
                                        "For indeed, with hardship [will be] ease."
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.loaderText}>
                                Loading prayers...
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CENTER COLUMN --- */}
                <div className={styles.column}>
                    {/* 2. Today's Progress */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Today's Progress</div>

                        <div className={styles.todayProgressGrid}>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressRing} style={{ background: `conic-gradient(var(--primary) ${todayCalculations.workPct}%, var(--border) 0)` }}>
                                    <div className={styles.donutHole}>
                                        <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--foreground)' }}>{Math.round(todayCalculations.workPct)}%</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>COMPLETED</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.todayStatsGrid}>
                                <div className={styles.statCard} style={{ background: 'var(--neutral-bg)' }}>
                                    <span className={styles.statLabel}>Total Hours</span>
                                    <span className={styles.statValue} style={{ color: 'var(--success-text)' }}>
                                        {minutesToHHMM(todayCalculations.workedToday).slice(1)}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Total Break</span>
                                    <span className={styles.statValue} style={{ color: 'var(--warning-text)' }}>
                                        {minutesToHHMM(todayCalculations.breakMin).slice(1)}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Est. Finish</span>
                                    <span className={styles.statValue}>
                                        {(() => {
                                            if (todayCalculations.requiredToday === 0) return 'Holiday';
                                            if (!session) return '--:--';
                                            const reqMs = todayCalculations.requiredToday * 60000;
                                            const workedMs = todayCalculations.workedToday * 60000;
                                            const remaining = reqMs - workedMs;
                                            if (remaining <= 0) return 'Now';
                                            const estimatedEnd = new Date(now + remaining);
                                            const h = String(estimatedEnd.getHours()).padStart(2, '0');
                                            const m = String(estimatedEnd.getMinutes()).padStart(2, '0');
                                            return `${h}h${m}m`;
                                        })()}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Daily Goal</span>
                                    <span className={styles.statValue}>
                                        {Math.floor(todayCalculations.requiredToday / 60)}h{String(todayCalculations.requiredToday % 60).padStart(2, '0')}m
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Productivity Analytics */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Productivity Analytics</div>

                        <div className={styles.kpiGrid}>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>Avg/Day</div>
                                <div className={styles.kpiValue}>{minutesToHHMM(analyticsData.weeklyAvg).slice(1)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>Best</div>
                                <div className={styles.kpiValue} style={{ color: 'var(--success-text)' }}>{analyticsData.mostProductive}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>Week Total</div>
                                <div className={styles.kpiValue}>{minutesToHHMM(analyticsData.totalWorkedWeek).slice(1)}</div>
                            </div>
                        </div>

                        <div className={styles.chartWrapper}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Weekly Activity</div>
                            <div className={styles.chartContainer}>
                                {analyticsData.dailyStats.map((d, i) => (
                                    <div key={i} className={styles.chartColumn} title={`${d.date}: ${Math.floor(d.worked / 60)}h${String(d.worked % 60).padStart(2, '0')}m`}>
                                        <div className={styles.chartBarBg}>
                                            <div className={`${styles.chartBarFill} ${d.isToday ? styles.today : ''}`}
                                                style={{ height: `${Math.min((d.worked / 600) * 100, 100)}%` }}>
                                                <div className={styles.chartTooltip}>
                                                    {Math.floor(d.worked / 60)}h${String(d.worked % 60).padStart(2, '0')}m
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.chartLabel}>{d.dayName}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className={styles.badgesGrid} style={{ marginTop: '1.5rem', gap: '0.5rem' }}>
                            <div className={`${styles.badge} ${analyticsData.achievements.earlyBird ? styles.unlocked : ''}`}>
                                <div style={{ fontSize: '1.25rem' }}>🌅</div>
                                <div className={styles.badgeLabel}>Early Bird</div>
                            </div>
                            <div className={`${styles.badge} ${analyticsData.achievements.consistency ? styles.unlocked : ''}`}>
                                <div style={{ fontSize: '1.25rem' }}>🔥</div>
                                <div className={styles.badgeLabel}>Streak</div>
                            </div>
                            <div className={`${styles.badge} ${analyticsData.achievements.focusMaster ? styles.unlocked : ''}`}>
                                <div style={{ fontSize: '1.25rem' }}>🎯</div>
                                <div className={styles.badgeLabel}>Focus</div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Logged Entries */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle} style={{ marginBottom: '1rem' }}>
                            <span>Logged Entries</span>
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={styles.input} style={{ width: 'auto', padding: '0.4rem', fontSize: '0.8rem' }} />
                        </div>

                        <div className={styles.entriesList}>
                            {sortedGroups.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No entries.
                                </div>
                            )}
                            {sortedGroups.map(group => (
                                <div key={group.date} className={styles.dateGroup}>
                                    <div className={styles.dateHeader}>
                                        {new Date(group.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </div>
                                    <div>
                                        {group.sessions.map(s => (
                                            <div key={s.id} className={styles.entryItem}>
                                                <div>
                                                    <div className={styles.entryTime}>
                                                        {msToHHMM(s.start)} - {s.end ? msToHHMM(s.end) : <span style={{ color: 'var(--primary)' }}>Active</span>}
                                                    </div>
                                                    <div className={styles.entryMeta}>
                                                        <span>{minutesToHHMM(entryWorkedMinutes(s, s.end || now)).slice(1)} worked</span>
                                                    </div>
                                                </div>
                                                <div className={styles.entryActions}>
                                                    <button className={styles.btnIcon} onClick={() => openEdit(s)}>✏️</button>
                                                    <button className={`${styles.btnIcon} ${styles.btnIconDestructive}`} onClick={() => deleteSession(s.id)}>🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className={styles.column}>
                    {/* Balance Overview */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Balance Overview</div>

                        <div className={styles.balanceOverview}>
                            <div className={styles.balanceCardBig} style={{
                                background: todayCalculations.displayTodayBalance < 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                            }}>
                                <span className={styles.label} style={{ color: todayCalculations.displayTodayBalance < 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>Daily Balance</span>
                                <span className={styles.value} style={{
                                    color: todayCalculations.displayTodayBalance < 0 ? 'var(--danger-text)' : 'var(--success-text)',
                                }}>
                                    {(!todayCalculations.hasActivity && !todayCalculations.isClosed) ? '--' : minutesToHHMM(todayCalculations.displayTodayBalance)}
                                </span>
                            </div>
                            <div className={styles.balanceCardBig} style={{
                                background: monthStats.balanceMin < 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                            }}>
                                <span className={styles.label} style={{ color: monthStats.balanceMin < 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>Monthly Balance</span>
                                <span className={styles.value} style={{
                                    color: monthStats.balanceMin < 0 ? 'var(--danger-text)' : 'var(--success-text)',
                                }}>
                                    {monthStats.hasData ? minutesToHHMM(monthStats.balanceMin) : '--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Manual Entry Quick Action */}
                    <div className={styles.card} style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Forgot to track?</span>
                            <button className={`${styles.button} ${styles.btnSecondary}`}
                                onClick={() => { setEditingId(null); setFormData({ date: todayDateKey, start: msToHHMM(now), end: msToHHMM(now + 3600000), breaks: [] }); setValidationErrors([]); setManualFormOpen(true); }}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                + Add Manually
                            </button>
                        </div>
                    </div>

                    {/* Holidays & Calendar */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Calendar</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(selectedMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                        </div>

                        <div className={styles.calendarGrid}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className={styles.calendarHeader}>{d}</div>)}
                            {calendarDays.map((day, i) => (
                                day ? (
                                    <div key={i} className={`${styles.calendarDay} ${day.isToday ? styles.today : ''} ${day.isHoliday ? styles.holiday : ''}`} title={day.holiday?.name}>
                                        <span>{day.day}</span>
                                        {day.isHoliday && <span style={{ fontSize: '0.6rem' }}>★</span>}
                                    </div>
                                ) : (
                                    <div key={i} className={styles.calendarDay}></div>
                                )
                            ))}
                        </div>

                        <div className={styles.holidayList}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Holidays</span>
                                <button className={styles.btnSecondary} onClick={() => setAddHolidayForm(!addHolidayForm)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                                    {addHolidayForm ? 'Cancel' : '+ Add'}
                                </button>
                            </div>

                            {addHolidayForm && (
                                <div className={styles.controlGrid} style={{ marginBottom: '1rem', background: 'var(--neutral-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <input type="date" value={holidayFormDate} onChange={e => setHolidayFormDate(e.target.value)} className={styles.input} />
                                    <input type="text" placeholder="Name" value={holidayFormName} onChange={e => setHolidayFormName(e.target.value)} className={styles.input} />
                                    <button className={`${styles.button} ${styles.btnPrimary}`} onClick={handleAddHoliday} disabled={!holidayFormDate || !holidayFormName}>Save</button>
                                </div>
                            )}

                            {activeHolidaysList.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No holidays.</div>}
                            {activeHolidaysList.map(h => (
                                <div key={h.id} className={`${styles.holidayItem} ${disabledHolidays.includes(h.id) ? styles.disabled : styles.active}`}>
                                    <div>
                                        <span className={styles.holidayDate}>{new Date(h.date).getDate()}</span>
                                        <span className={styles.holidayName} style={{ marginLeft: '0.5rem' }}>{h.name}</span>
                                    </div>
                                    <button className={styles.btnIcon} onClick={() => toggleHolidayDisable(h)} title={h.isCustom ? "Remove" : "Disable"}>
                                        {h.isCustom ? '🗑️' : (disabledHolidays.includes(h.id) ? 'Enable' : 'Disable')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {manualFormOpen && (
                <div className={styles.overlay} onClick={() => setManualFormOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>{editingId ? 'Edit Session' : 'Add Session'}</h3>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Date</label>
                            <input type="date" className={styles.input} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        <div className={styles.controlGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Start Time</label>
                                <input type="time" className={styles.input} value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>End Time</label>
                                <input type="time" className={styles.input} value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label className={styles.label} style={{ margin: 0 }}>Breaks</label>
                                <button className={`${styles.button} ${styles.btnSecondary}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                    onClick={() => setFormData({ ...formData, breaks: [...formData.breaks, { id: generateId(), start: formData.start, end: formData.start, type: 'short' }] })}>
                                    + Add Break
                                </button>
                            </div>
                            {formData.breaks.map((b) => (
                                <div key={b.id} className={styles.breakRow} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <select className={styles.input} style={{ width: '80px' }} value={b.type} onChange={e => setFormData({ ...formData, breaks: formData.breaks.map(item => item.id === b.id ? { ...item, type: e.target.value as BreakType } : item) })}>
                                        <option value="short">Short</option>
                                        <option value="lunch">Lunch</option>
                                    </select>
                                    <input type="time" className={styles.input} value={b.start} onChange={e => setFormData({ ...formData, breaks: formData.breaks.map(item => item.id === b.id ? { ...item, start: e.target.value } : item) })} />
                                    <input type="time" className={styles.input} value={b.end} onChange={e => setFormData({ ...formData, breaks: formData.breaks.map(item => item.id === b.id ? { ...item, end: e.target.value } : item) })} />
                                    <button className={`${styles.btnIcon} ${styles.btnIconDestructive}`} onClick={() => setFormData({ ...formData, breaks: formData.breaks.filter(item => item.id !== b.id) })}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button className={`${styles.button} ${styles.btnSecondary}`} onClick={() => setManualFormOpen(false)}>Cancel</button>
                            <button className={`${styles.button} ${styles.btnPrimary}`} onClick={handleSaveManual}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
