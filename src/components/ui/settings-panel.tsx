"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Euro, Settings, Plus, Trash2, Save, X, CalendarX } from 'lucide-react';

interface TimeInterval {
  id: string;
  openTime: string;
  closeTime: string;
}

interface OperatingHours {
  weekday: number;
  isActive: boolean;
  timeIntervals: TimeInterval[];
}

interface GlobalSettings {
  bookingDurationMinutes: number;
}

const WEEKDAYS = [
  'Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'
];

export default function SettingsPanel() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    bookingDurationMinutes: 60
  });
  
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false);
  const [blockedIntervals, setBlockedIntervals] = useState<any[]>([]);
  const [newBlockedInterval, setNewBlockedInterval] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  });
  const [blockedIntervalsLoading, setBlockedIntervalsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load global settings
      const settingsRes = await fetch('/api/global-settings');
      const settingsData = await settingsRes.json();
      if (settingsData.bookingDurationMinutes) {
        setGlobalSettings({
          bookingDurationMinutes: settingsData.bookingDurationMinutes
        });
      }

      // Load operating hours
      const hoursRes = await fetch('/api/operating-hours');
      const hoursData = await hoursRes.json();
      
      // Initialize all weekdays with default values if not present
      const allWeekdays: OperatingHours[] = [];
      for (let i = 0; i < 7; i++) {
        const existing = hoursData.find((h: OperatingHours) => h.weekday === i);
        allWeekdays.push(existing || {
          weekday: i,
          isActive: false,
          timeIntervals: []
        });
      }
      setOperatingHours(allWeekdays);

      // Load blocked dates
      const blockedRes = await fetch('/api/blocked-dates?all=true');
      if (blockedRes.ok) {
        const blockedData = await blockedRes.json();
        setBlockedDates(blockedData.map((item: any) => item.date));
      }

      // Load blocked intervals
      const intervalsRes = await fetch('/api/blocked-intervals?all=true');
      if (intervalsRes.ok) {
        const intervalsData = await intervalsRes.json();
        setBlockedIntervals(intervalsData);
      }
    } catch (error) {
      setMessage('Σφάλμα κατά τη φόρτωση των ρυθμίσεων');
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/global-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      
      if (res.ok) {
        setMessage('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Σφάλμα κατά την αποθήκευση των ρυθμίσεων');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την αποθήκευση των ρυθμίσεων');
    } finally {
      setSaving(false);
    }
  };

  const saveOperatingHours = async (weekday: number) => {
    setSaving(true);
    try {
      const hours = operatingHours.find(h => h.weekday === weekday);
      if (!hours) return;

      const res = await fetch('/api/operating-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours)
      });
      
      if (res.ok) {
        setMessage(`Οι ώρες λειτουργίας για ${WEEKDAYS[weekday]} αποθηκεύτηκαν!`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Σφάλμα κατά την αποθήκευση των ωρών λειτουργίας');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την αποθήκευση των ωρών λειτουργίας');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayActive = (weekday: number) => {
    setOperatingHours(prev => prev.map(h => 
      h.weekday === weekday 
        ? { ...h, isActive: !h.isActive }
        : h
    ));
  };

  const addTimeInterval = (weekday: number) => {
    const newInterval: TimeInterval = {
      id: Date.now().toString(),
      openTime: '09:00',
      closeTime: '17:00'
    };
    
    setOperatingHours(prev => prev.map(h => 
      h.weekday === weekday 
        ? { ...h, timeIntervals: [...h.timeIntervals, newInterval] }
        : h
    ));
  };

  const removeTimeInterval = (weekday: number, intervalId: string) => {
    setOperatingHours(prev => prev.map(h => 
      h.weekday === weekday 
        ? { ...h, timeIntervals: h.timeIntervals.filter(t => t.id !== intervalId) }
        : h
    ));
  };

  const updateTimeInterval = (weekday: number, intervalId: string, field: 'openTime' | 'closeTime', value: string) => {
    setOperatingHours(prev => prev.map(h => 
      h.weekday === weekday 
        ? { 
            ...h, 
            timeIntervals: h.timeIntervals.map(t => 
              t.id === intervalId ? { ...t, [field]: value } : t
            )
          }
        : h
    ));
  };

  // Blocked dates functions
  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;
    
    setBlockedDatesLoading(true);
    try {
      const response = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newBlockedDate })
      });
      if (response.ok) {
        setBlockedDates([...blockedDates, newBlockedDate]);
        setNewBlockedDate('');
        setMessage('Η ημερομηνία αποκλείστηκε!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Σφάλμα κατά την αποκλεισμό της ημερομηνίας.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την αποκλεισμό της ημερομηνίας.');
    }
    setBlockedDatesLoading(false);
  };

  const handleRemoveBlockedDate = async (date: string) => {
    setBlockedDatesLoading(true);
    try {
      const response = await fetch(`/api/blocked-dates?date=${date}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setBlockedDates(blockedDates.filter(d => d !== date));
        setMessage('Η ημερομηνία ξεαποκλείστηκε!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Σφάλμα κατά την ξεαποκλεισμό της ημερομηνίας.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την ξεαποκλεισμό της ημερομηνίας.');
    }
    setBlockedDatesLoading(false);
  };

  // Blocked intervals functions
  const handleAddBlockedInterval = async () => {
    if (!newBlockedInterval.date || !newBlockedInterval.startTime || !newBlockedInterval.endTime) {
      setMessage('Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία.');
      return;
    }
    
    setBlockedIntervalsLoading(true);
    try {
      const response = await fetch('/api/blocked-intervals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlockedInterval)
      });
      
      if (response.ok) {
        const newInterval = {
          ...newBlockedInterval,
          _id: Date.now().toString(), // Temporary ID for UI
          createdAt: new Date()
        };
        setBlockedIntervals([...blockedIntervals, newInterval]);
        setNewBlockedInterval({ date: '', startTime: '', endTime: '', reason: '' });
        setMessage('Το διάστημα αποκλείστηκε!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Σφάλμα κατά την αποκλεισμό του διαστήματος.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την αποκλεισμό του διαστήματος.');
    }
    setBlockedIntervalsLoading(false);
  };

  const handleRemoveBlockedInterval = async (id: string) => {
    setBlockedIntervalsLoading(true);
    try {
      const response = await fetch(`/api/blocked-intervals?id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setBlockedIntervals(blockedIntervals.filter(i => i._id !== id));
        setMessage('Το διάστημα ξεαποκλείστηκε!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Σφάλμα κατά την ξεαποκλεισμό του διαστήματος.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την ξεαποκλεισμό του διαστήματος.');
    }
    setBlockedIntervalsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FBDAC6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg ${
              message.includes('Σφάλμα') 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-[#FBDAC6]" />
          <h2 className="text-2xl font-bold text-gray-800">Ρυθμίσεις Κρατήσεων</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Booking Duration */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4" />
              Διάρκεια Κράτησης (λεπτά)
            </label>
            <input
              type="number"
              value={globalSettings.bookingDurationMinutes}
              onChange={(e) => setGlobalSettings(prev => ({ 
                ...prev, 
                bookingDurationMinutes: parseInt(e.target.value) || 60 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FBDAC6] focus:border-transparent"
              min="15"
              step="15"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={saveGlobalSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#FBDAC6] hover:bg-[#F9C4A3] text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Ρυθμίσεων'}
          </button>
        </div>
      </motion.div>

      {/* Operating Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-[#FBDAC6]" />
          <h2 className="text-2xl font-bold text-gray-800">Ώρες Λειτουργίας</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {operatingHours.map((day) => (
            <motion.div
              key={day.weekday}
              className="border border-gray-200 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{WEEKDAYS[day.weekday]}</h3>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isActive}
                    onChange={() => toggleDayActive(day.weekday)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-colors ${
                    day.isActive 
                      ? 'bg-[#FBDAC6] border-[#FBDAC6]' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {day.isActive && (
                      <svg className="w-3 h-3 text-gray-800 m-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              </div>

              {day.isActive && (
                <div className="space-y-3">
                  {day.timeIntervals.map((interval) => (
                    <div key={interval.id} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={interval.openTime}
                        onChange={(e) => updateTimeInterval(day.weekday, interval.id, 'openTime', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#FBDAC6] focus:border-transparent"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={interval.closeTime}
                        onChange={(e) => updateTimeInterval(day.weekday, interval.id, 'closeTime', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#FBDAC6] focus:border-transparent"
                      />
                      <button
                        onClick={() => removeTimeInterval(day.weekday, interval.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addTimeInterval(day.weekday)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-green-600 hover:text-green-700 border border-green-300 hover:border-green-400 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Προσθήκη διαστήματος
                  </button>

                  <button
                    onClick={() => saveOperatingHours(day.weekday)}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-[#FBDAC6] hover:bg-[#F9C4A3] text-gray-800 font-medium rounded transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Blocked Dates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <CalendarX className="w-6 h-6 text-[#FBDAC6]" />
          <h2 className="text-2xl font-bold text-gray-800">Κλειστές Ημερομηνίες</h2>
        </div>

        {/* Add new blocked date */}
        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FBDAC6] focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={handleAddBlockedDate}
              disabled={!newBlockedDate || blockedDatesLoading}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {blockedDatesLoading ? 'Προσθήκη...' : 'Προσθήκη'}
            </button>
          </div>
        </div>

        {/* Blocked dates list */}
        <div className="space-y-3">
          {blockedDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν κλειστές ημερομηνίες
            </div>
          ) : (
            blockedDates
              .sort()
              .map((date) => (
                <div
                  key={date}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <CalendarX className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-gray-800">
                      {new Date(date).toLocaleDateString('el-GR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveBlockedDate(date)}
                    disabled={blockedDatesLoading}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
          )}
        </div>
      </motion.div>

      {/* Blocked Time Intervals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-[#FBDAC6]" />
          <h2 className="text-2xl font-bold text-gray-800">Αποκλεισμένα Διαστήματα</h2>
        </div>

        {/* Add new blocked interval */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ημερομηνία</label>
              <input
                type="date"
                value={newBlockedInterval.date}
                onChange={(e) => setNewBlockedInterval(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FBDAC6] focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Αιτία (προαιρετικό)</label>
              <input
                type="text"
                value={newBlockedInterval.reason}
                onChange={(e) => setNewBlockedInterval(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="π.χ. Προσωπικό ραντεβού"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FBDAC6] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ώρα Έναρξης</label>
              <input
                type="time"
                value={newBlockedInterval.startTime}
                onChange={(e) => setNewBlockedInterval(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FBDAC6] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ώρα Λήξης</label>
              <input
                type="time"
                value={newBlockedInterval.endTime}
                onChange={(e) => setNewBlockedInterval(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FBDAC6] focus:border-transparent"
              />
            </div>
          </div>
          
          <button
            onClick={handleAddBlockedInterval}
            disabled={!newBlockedInterval.date || !newBlockedInterval.startTime || !newBlockedInterval.endTime || blockedIntervalsLoading}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {blockedIntervalsLoading ? 'Προσθήκη...' : 'Προσθήκη Διαστήματος'}
          </button>
        </div>

        {/* Blocked intervals list */}
        <div className="space-y-3">
          {blockedIntervals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν αποκλεισμένα διαστήματα
            </div>
          ) : (
            blockedIntervals
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((interval) => (
                <div
                  key={interval._id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <span className="font-medium text-gray-800">
                        {new Date(interval.date).toLocaleDateString('el-GR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <div className="text-sm text-gray-600">
                        {interval.startTime} - {interval.endTime}
                        {interval.reason && ` (${interval.reason})`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBlockedInterval(interval._id)}
                    disabled={blockedIntervalsLoading}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
