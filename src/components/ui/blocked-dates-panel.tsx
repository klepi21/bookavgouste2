"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface BlockedDate {
  _id?: string;
  startDate: string;
  endDate: string;
  reason: string;
  isFullDay: boolean;
  createdAt?: Date;
}

export default function BlockedDatesPanel() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const [newBlockedDate, setNewBlockedDate] = useState<BlockedDate>({
    startDate: '',
    endDate: '',
    reason: '',
    isFullDay: true
  });

  // Load blocked dates on mount
  useEffect(() => {
    loadBlockedDates();
  }, []);

  const loadBlockedDates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blocked-dates');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlockedDates(data);
      }
    } catch (error) {
      setMessage('Σφάλμα κατά τη φόρτωση των κλειστών ημερομηνιών');
    } finally {
      setLoading(false);
    }
  };

  const addBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlockedDate)
      });
      
      if (res.ok) {
        setMessage('Η κλειστή ημερομηνία προστέθηκε επιτυχώς!');
        setNewBlockedDate({
          startDate: '',
          endDate: '',
          reason: '',
          isFullDay: true
        });
        setShowAddForm(false);
        loadBlockedDates();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json();
        setMessage(errorData.error || 'Σφάλμα κατά την προσθήκη της κλειστής ημερομηνίας');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την προσθήκη της κλειστής ημερομηνίας');
    } finally {
      setSaving(false);
    }
  };

  const deleteBlockedDate = async (id: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την κλειστή ημερομηνία;')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/blocked-dates?id=${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setMessage('Η κλειστή ημερομηνία διαγράφηκε επιτυχώς!');
        loadBlockedDates();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Σφάλμα κατά τη διαγραφή της κλειστής ημερομηνίας');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά τη διαγραφή της κλειστής ημερομηνίας');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (startDate === endDate) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800">Κλειστές Ημερομηνίες</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Προσθήκη Κλειστής Ημερομηνίας
        </button>
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Προσθήκη Κλειστής Ημερομηνίας</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={addBlockedDate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ημερομηνία Έναρξης *
                    </label>
                    <input
                      type="date"
                      value={newBlockedDate.startDate}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ημερομηνία Λήξης *
                    </label>
                    <input
                      type="date"
                      value={newBlockedDate.endDate}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Λόγος Κλεισίματος
                  </label>
                  <input
                    type="text"
                    value={newBlockedDate.reason}
                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="π.χ. Συντήρηση, Ειδική Εκδήλωση"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fullDay"
                    checked={newBlockedDate.isFullDay}
                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, isFullDay: e.target.checked }))}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="fullDay" className="text-sm font-medium text-gray-700">
                    Κλείσιμο όλης της ημέρας
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Ακύρωση
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Προσθήκη...' : 'Προσθήκη Κλειστής Ημερομηνίας'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked Dates List */}
      <div className="bg-white rounded-xl shadow-lg">
        {blockedDates.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Δεν υπάρχουν κλειστές ημερομηνίες</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {blockedDates.map((blockedDate) => (
              <motion.div
                key={blockedDate._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-800">
                          {formatDateRange(blockedDate.startDate, blockedDate.endDate)}
                        </span>
                      </div>
                      {blockedDate.isFullDay && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Όλη η ημέρα
                        </span>
                      )}
                    </div>
                    {blockedDate.reason && (
                      <p className="text-sm text-gray-600 mt-1">{blockedDate.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteBlockedDate(blockedDate._id!)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Διαγραφή"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
