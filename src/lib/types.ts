export type EntryType = 'CHECK_IN' | 'CHECK_OUT';

export interface TimeEntry {
    id: string;
    user_id: string;
    type: EntryType;
    timestamp: string;
    reason?: string;
    created_at: string;
}

export interface Profile {
    id: string;
    name: string;
    email: string;
}

export interface Quote {
    id: string;
    text: string;
    author?: string;
}
