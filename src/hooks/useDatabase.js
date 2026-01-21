import { useState, useEffect, useCallback } from 'react';

// This is a custom hook to interact with the database safely
export const useDatabase = () => {
    const [error, setError] = useState(null);

    const run = useCallback(async (sql, params = []) => {
        try {
            if (!window.electronAPI) throw new Error("Electron API not available");
            return await window.electronAPI.run(sql, params);
        } catch (err) {
            console.error("DB Run Error:", err);
            setError(err);
            return null;
        }
    }, []);

    const query = useCallback(async (sql, params = []) => {
        try {
            if (!window.electronAPI) throw new Error("Electron API not available");
            // Direct call to preload exposed method which wraps IPC
            return await window.electronAPI.query(sql, params);
        } catch (err) {
            console.error("DB Query Error:", err);
            setError(err);
            return [];
        }
    }, []);

    return { run, query, error };
};
