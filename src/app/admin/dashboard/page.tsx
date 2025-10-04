"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingCalendar from '@/components/ui/booking-calendar';
import SettingsPanel from '@/components/ui/settings-panel';

import { Navbar1 } from '@/components/ui/navbar-1';

const WEEKDAYS = [
  'Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'
];

const SERVICES = [
  'Απλή επίσκεψη',
  'Αντιμετώπιση μυοσκελετικού πόνου',
  'Αντιμετώπιση κεφαλαγίας - ημικρανίας',
  'Αντιμετώπιση αυχενικού συνδρόμου',
  'Αντιμετώπιση οσφυαλγίας',
  'Αντιμετώπιση άγχους',
  'Διακοπή καπνίσματος',
  'Αντιμετώπιση δυσμηνόρροιας',
  'Αντιμετώπιση Παχυσαρκίας',
  'Θεραπευτική Συνεδρία'
];

// Dynamic time slot generation system
const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number) => {
  const slots = [];
  const totalMinutes = (endHour - startHour) * 60;
  const numSlots = Math.floor(totalMinutes / intervalMinutes);
  
  for (let i = 0; i < numSlots; i++) {
    const totalMinutesFromStart = i * intervalMinutes;
    const hour = startHour + Math.floor(totalMinutesFromStart / 60);
    const minute = totalMinutesFromStart % 60;
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Calculate end time
    const endTotalMinutes = totalMinutesFromStart + intervalMinutes;
    const endHourCalc = startHour + Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    slots.push(`${startTime} - ${endTime}`);
  }
  
  return slots;
};

// Predefined slot configurations
const SLOT_CONFIGS: Record<string, { label: string; interval: number }> = {
  '30min': { label: '30 λεπτά', interval: 30 },
  '45min': { label: '45 λεπτά', interval: 45 },
  '1hour': { label: '1 ώρα', interval: 60 },
  '90min': { label: '90 λεπτά', interval: 90 }
};

// Default to 45-minute slots
const DEFAULT_SLOT_CONFIG = '45min';
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 21;

// Generate default time slots (45-minute intervals)
const TIME_SLOTS = generateTimeSlots(DEFAULT_START_HOUR, DEFAULT_END_HOUR, SLOT_CONFIGS[DEFAULT_SLOT_CONFIG].interval);
const HOUR_SLOTS = TIME_SLOTS; // Use the same dynamic slotsg

// Helper to convert a time string (e.g. '13:30') to Greek format
function formatGreekTime(time: string): string {
  if (!time) return '';
  // If time is a range, format both sides
  if (time.includes('-')) {
    const [start, end] = time.split('-').map(t => t.trim());
    return `${formatGreekTime(start)} - ${formatGreekTime(end)}`;
  }
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const minute = m ? parseInt(m, 10) : 0;
  const isAM = hour < 12;
  const suffix = isAM ? 'π.μ.' : 'μ.μ.';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  type Booking = {
    _id: string;
    name: string;
    service: string;
    date: string;
    time: string;
    telephone: string;
    email: string;
  };
  type Timeslot = {
    _id: string;
    date: string;
    time: string;
    service: string;
    available: boolean;
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    service: '',
    date: '',
    time: '',
    name: '',
    telephone: '',
    email: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Booking & { confirm?: string } | null>(null);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editTime, setEditTime] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [patientOptions, setPatientOptions] = useState<{ name: string; telephone: string; email: string }[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showContactFields, setShowContactFields] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('adminSession') !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  // Fetch bookings
  useEffect(() => {
    async function fetchBookings() {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const res = await fetch('/api/bookings-list');
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
        else setBookingsError(data.error || 'Σφάλμα φόρτωσης κρατήσεων.');
      } catch {
        setBookingsError('Σφάλμα φόρτωσης κρατήσεων.');
      } finally {
        setBookingsLoading(false);
      }
    }
    fetchBookings();
    fetchCurrentAnnouncement();
  }, []);




  // Cancel booking
  async function handleCancelBooking(id: string) {
    if (!confirm('Θέλετε σίγουρα να ακυρώσετε αυτή την κράτηση;')) return;
    const res = await fetch(`/api/bookings-list?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    setMessage(data.success ? 'Η κράτηση ακυρώθηκε.' : data.error || 'Σφάλμα ακύρωσης.');
    setBookings(bookings.filter(b => b._id !== id));
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem('adminSession');
    router.push('/admin/login');
  }

  // Navigate to history page
  function handleNavigateToHistory() {
    router.push('/admin/history');
  }

  async function handleCreateBooking(e: any) {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBookingModal(false);
        setNewBooking({ service: '', date: '', time: '', name: '', telephone: '', email: '' });
        setMessage('Η κράτηση δημιουργήθηκε!');
        // Refresh bookings
        const res2 = await fetch('/api/bookings-list');
        const data2 = await res2.json();
        setBookings(Array.isArray(data2) ? data2 : []);
      } else {
        setBookingError(data.error || 'Σφάλμα κατά τη δημιουργία κράτησης.');
      }
    } catch {
      setBookingError('Σφάλμα κατά τη δημιουργία κράτησης.');
    } finally {
      setBookingLoading(false);
    }
  }

  // Handle booking actions from calendar
  const handleEditBooking = (booking: Booking) => {
    setSelectedEvent(booking);
    setEditDate(booking.date);
    setEditTime(booking.time);
  };

  const handleDeleteBooking = (booking: Booking) => {
    if (confirm('Θέλετε σίγουρα να ακυρώσετε αυτή την κράτηση;')) {
      handleCancelBooking(booking._id);
    }
  };

  // When opening edit modal, initialize editDate/editTime
  useEffect(() => {
    if (selectedEvent && selectedEvent.confirm === 'edit') {
      setEditDate(selectedEvent.date);
      setEditTime(selectedEvent.time);
    }
  }, [selectedEvent]);

  // Fetch unique patient names for dropdown
  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/bookings-list');
        const data = await res.json();
        if (Array.isArray(data)) {
          const seen = new Set();
          const unique = [];
          for (const b of data) {
            const name = b.name?.trim();
            if (name && !seen.has(name)) {
              seen.add(name);
              unique.push({ name, telephone: b.telephone || '', email: b.email || '' });
            }
          }
          setPatientOptions(unique);
        }
      } catch {}
    }
    fetchPatients();
  }, [showBookingModal]);


  // Announcement functions
  async function fetchCurrentAnnouncement() {
    setAnnouncementLoading(true);
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setCurrentAnnouncement(data);
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
    }
    setAnnouncementLoading(false);
  }

  async function handlePostAnnouncement() {
    if (!announcement.trim()) return;
    
    setAnnouncementLoading(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcement, type: announcementType })
      });
      if (response.ok) {
        setAnnouncement('');
        setAnnouncementType('info');
        await fetchCurrentAnnouncement();
        setMessage('Η ανακοίνωση δημοσιεύθηκε!');
      } else {
        const data = await response.json();
        setMessage(data.error || 'Σφάλμα κατά τη δημοσίευση της ανακοίνωσης.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά τη δημοσίευση της ανακοίνωσης.');
    }
    setAnnouncementLoading(false);
  }

  async function handleRemoveAnnouncement() {
    setAnnouncementLoading(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'DELETE'
      });
      if (response.ok) {
        setCurrentAnnouncement(null);
        setMessage('Η ανακοίνωση αφαιρέθηκε!');
      } else {
        setMessage('Σφάλμα κατά την αφαίρεση της ανακοίνωσης.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την αφαίρεση της ανακοίνωσης.');
    }
    setAnnouncementLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      <Navbar1 
        onLogout={handleLogout} 
        onNewBooking={() => setShowBookingModal(true)} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigateToHistory={handleNavigateToHistory}
      />
      <section className="w-full py-8 px-8">
        {message && <div className="mb-4 text-center text-green-700 font-bold text-lg">{message}</div>}
        {/* Calendar Section */}
        {activeTab === 'calendar' && (
          <div className="mb-8">
            <BookingCalendar 
              bookings={bookings}
              onEditBooking={handleEditBooking}
              onDeleteBooking={handleDeleteBooking}
            />
          </div>
        )}


        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div className="mb-8 px-8">
            <SettingsPanel />
          </div>
        )}


        {/* Announcements Section */}
        {activeTab === 'announcements' && (
          <div className="mb-8 px-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Ανακοινώσεις</h2>
            
            {/* Current Announcement */}
            {currentAnnouncement && (
              <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Τρέχουσα Ανακοίνωση</h3>
                  <button 
                    onClick={handleRemoveAnnouncement}
                    disabled={announcementLoading}
                    className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Αφαίρεση
                  </button>
                </div>
                <div className={`p-4 rounded-lg ${
                  currentAnnouncement.type === 'info' ? 'bg-blue-50 border border-blue-200' :
                  currentAnnouncement.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  currentAnnouncement.type === 'success' ? 'bg-green-50 border border-green-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-gray-800 font-medium">{currentAnnouncement.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Δημοσιεύθηκε: {new Date(currentAnnouncement.createdAt).toLocaleDateString('el-GR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Add New Announcement */}
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Νέα Ανακοίνωση</h3>
              
              <div className="space-y-4">
                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Μήνυμα:</label>
                  <textarea 
                    value={announcement} 
                    onChange={e => setAnnouncement(e.target.value)} 
                    placeholder="π.χ. Θα κλείσουμε για διακοπές από 15-20 Αυγούστου"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition resize-none"
                    rows={4}
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Τύπος Ανακοίνωσης:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'info', label: 'Πληροφορία', color: 'bg-blue-500' },
                      { value: 'warning', label: 'Προειδοποίηση', color: 'bg-yellow-500' },
                      { value: 'success', label: 'Επιτυχία', color: 'bg-green-500' },
                      { value: 'error', label: 'Σφάλμα', color: 'bg-red-500' }
                    ].map(type => (
                      <button
                        key={type.value}
                        onClick={() => setAnnouncementType(type.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                          announcementType === type.value 
                            ? 'border-gray-400 bg-gray-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  onClick={handlePostAnnouncement}
                  disabled={!announcement.trim() || announcementLoading}
                  className="w-full bg-orange-200 hover:bg-orange-300 disabled:bg-gray-400 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {announcementLoading ? 'Δημοσίευση...' : 'Δημοσίευση Ανακοίνωσης'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl" onClick={() => setShowBookingModal(false)}>&times;</button>
              <h3 className="text-xl font-bold mb-4">Νέα Κράτηση</h3>
              <form className="space-y-4" onSubmit={handleCreateBooking}>
                <div>
                  <label className="block font-semibold mb-1">Υπηρεσία</label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    value={newBooking.service} 
                    onChange={e => setNewBooking({ ...newBooking, service: e.target.value })} 
                    required
                  >
                    <option value="">Επιλέξτε υπηρεσία</option>
                    {SERVICES.map((service, index) => (
                      <option key={index} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1">Ημερομηνία</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={newBooking.date} onChange={e => setNewBooking({ ...newBooking, date: e.target.value })} required />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-1">Ώρα</label>
                    <select 
                      className="w-full border rounded px-3 py-2" 
                      value={newBooking.time} 
                      onChange={e => setNewBooking({ ...newBooking, time: e.target.value })} 
                      required
                    >
                      <option value="">Επιλέξτε ώρα</option>
                      {TIME_SLOTS.map((time, index) => (
                        <option key={index} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Όνομα</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={newBooking.name}
                      onChange={e => {
                        setNewBooking({ ...newBooking, name: e.target.value });
                        setNameSearch(e.target.value);
                        setShowNameDropdown(true);
                      }}
                      onFocus={() => setShowNameDropdown(true)}
                      autoComplete="off"
                      required
                    />
                    {showNameDropdown && nameSearch.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 bg-white border rounded shadow max-h-48 overflow-y-auto">
                        {patientOptions.filter(p => p.name.toLowerCase().includes(nameSearch.toLowerCase())).length === 0 ? (
                          <div className="px-3 py-2 text-gray-500">Δεν βρέθηκε, πληκτρολογήστε νέο όνομα</div>
                        ) : (
                          patientOptions.filter(p => p.name.toLowerCase().includes(nameSearch.toLowerCase())).map((p, i) => (
                            <div
                              key={p.name + i}
                              className="px-3 py-2 hover:bg-[#DFE7CA] cursor-pointer"
                              onClick={() => {
                                setNewBooking({ ...newBooking, name: p.name, telephone: p.telephone, email: p.email });
                                setNameSearch(p.name);
                                setShowNameDropdown(false);
                              }}
                            >
                              {p.name} <span className="text-xs text-gray-400">{p.telephone} {p.email}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowContactFields(!showContactFields)}
                    className="text-sm text-gray-600 hover:text-black transition flex items-center gap-1"
                  >
                    {showContactFields ? '−' : '+'} Προσθήκη επικοινωνίας (προαιρετικό)
                  </button>
                  {showContactFields && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <div>
                        <label className="block font-semibold mb-1">Τηλέφωνο</label>
                        <input 
                          type="tel" 
                          className="w-full border rounded px-3 py-2" 
                          value={newBooking.telephone} 
                          onChange={e => setNewBooking({ ...newBooking, telephone: e.target.value })} 
                          placeholder="π.χ. 6971234567"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Email</label>
                        <input 
                          type="email" 
                          className="w-full border rounded px-3 py-2" 
                          value={newBooking.email} 
                          onChange={e => setNewBooking({ ...newBooking, email: e.target.value })} 
                          placeholder="π.χ. example@email.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {bookingError && <div className="text-red-600 text-sm font-bold">{bookingError}</div>}
                <button type="submit" className="w-full bg-black text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition" disabled={bookingLoading}>{bookingLoading ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
              </form>
              {/* Hide dropdown on click outside */}
              {showNameDropdown && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNameDropdown(false)}
                  style={{ pointerEvents: 'auto' }}
                />
              )}
            </div>
          </div>
        )}
        {/* Edit Modal */}
        {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl" onClick={() => setSelectedEvent(null)}>&times;</button>
                <h3 className="text-xl font-bold mb-4">Επεξεργασία Κράτησης</h3>
                <form
                  className="space-y-3"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!editDate || !editTime) return;
                    setEditSaving(true);
                    const res = await fetch(`/api/bookings-list?id=${selectedEvent._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ date: editDate, time: editTime }),
                    });
                    const data = await res.json();
                    setEditSaving(false);
                    if (res.ok && data.success) {
                      setSelectedEvent(null);
                      setMessage('Η κράτηση ενημερώθηκε!');
                      // Refresh bookings
                      const res2 = await fetch('/api/bookings-list');
                      const data2 = await res2.json();
                      setBookings(Array.isArray(data2) ? data2 : []);
                    } else {
                      alert(data.error || 'Σφάλμα ενημέρωσης κράτησης.');
                    }
                  }}
                >
                  <div className="space-y-2 text-black text-base mb-4">
                    <div><span className="font-semibold">Όνομα:</span> {selectedEvent.name}</div>
                    <div><span className="font-semibold">Υπηρεσία:</span> {selectedEvent.service}</div>
                    <div><span className="font-semibold">Τηλέφωνο:</span> {selectedEvent.telephone}</div>
                    <div><span className="font-semibold">Email:</span> {selectedEvent.email}</div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Ημερομηνία</label>
                    <input
                      type="date"
                      name="date"
                      className="w-full border rounded px-3 py-2"
                      value={editDate || ''}
                      onChange={e => setEditDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Ώρα</label>
                    <input
                      type="text"
                      name="time"
                      className="w-full border rounded px-3 py-2"
                      value={editTime || ''}
                      onChange={e => setEditTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-200"
                      onClick={() => setSelectedEvent(null)}
                      disabled={editSaving}
                    >Άκυρο</button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-orange-500 text-white font-bold"
                      disabled={editSaving || !editDate || !editTime}
                    >{editSaving ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}
