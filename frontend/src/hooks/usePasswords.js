import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export default function usePasswords() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntries = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await api.passwords.list(params);
      setEntries(res.data.entries);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (data) => {
    const res = await api.passwords.create(data);
    setEntries(prev => [res.data.entry, ...prev]);
    return res.data.entry;
  }, []);

  const updateEntry = useCallback(async (id, data) => {
    const res = await api.passwords.update(id, data);
    setEntries(prev => prev.map(e => e.id === id ? res.data.entry : e));
    return res.data.entry;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    await api.passwords.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const decryptPassword = useCallback(async (id) => {
    const res = await api.passwords.decrypt(id);
    return res.data.password;
  }, []);

  const toggleSearch = useCallback(async (id, include) => {
    await api.passwords.updateSettings(id, { include_in_search: include });
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, include_in_search: include ? 1 : 0 } : e
    ));
  }, []);

  return {
    entries, loading, error,
    fetchEntries, createEntry, updateEntry, deleteEntry,
    decryptPassword, toggleSearch,
  };
}
