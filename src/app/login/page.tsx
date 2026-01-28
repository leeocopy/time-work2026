"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                setMessage('Success! Check your email for the confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.authCard}>
                <div className={styles.logoArea}>
                    <span className={styles.logo}>⏱️ ANTIGRAVITY</span>
                    <p className={styles.subtitle}>
                        {isSignUp ? 'Create your workspace account' : 'Welcome back, Commander'}
                    </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {message && <div className={styles.success}>{message}</div>}

                <form className={styles.form} onSubmit={handleAuth}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Electronic Mail</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Access Code</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className={styles.button} disabled={loading}>
                        {loading ? 'Processing...' : isSignUp ? 'Initialize Account' : 'Authenticate'}
                    </button>
                </form>

                <div className={styles.toggleAuth}>
                    {isSignUp ? 'Already specialized?' : 'New to the system?'}
                    <span
                        className={styles.toggleLink}
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? 'Sign In' : 'Create Account'}
                    </span>
                </div>
            </div>
        </div>
    );
}
