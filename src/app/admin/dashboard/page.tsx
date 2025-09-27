"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingCalendar from '@/components/ui/booking-calendar';

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
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [newTimeslot, setNewTimeslot] = useState({ date: '', time: '', service: '' });
  const [message, setMessage] = useState('');
  const [globalSlots, setGlobalSlots] = useState<{ weekday: number; time: string; service?: string }[]>([]);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // Default to Monday
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideSlots, setOverrideSlots] = useState<{ [time: string]: boolean }>({});
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false);
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentSlotConfig, setCurrentSlotConfig] = useState(DEFAULT_SLOT_CONFIG);
  const [currentStartHour, setCurrentStartHour] = useState(DEFAULT_START_HOUR);
  const [currentEndHour, setCurrentEndHour] = useState(DEFAULT_END_HOUR);

  // Function to get current time slots based on state
  const getCurrentTimeSlots = () => {
    const slots = generateTimeSlots(currentStartHour, currentEndHour, SLOT_CONFIGS[currentSlotConfig].interval);
    console.log('getCurrentTimeSlots called:', { currentStartHour, currentEndHour, currentSlotConfig, slots });
    return slots;
  };

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
    fetchBlockedDates();
    fetchCurrentAnnouncement();
  }, []);

  // Fetch timeslots
  useEffect(() => {
    async function fetchTimeslots() {
      const res = await fetch('/api/timeslots');
      const data = await res.json();
      if (Array.isArray(data)) setTimeslots(data);
    }
    fetchTimeslots();
  }, [message]);

  // Fetch global slots
  useEffect(() => {
    async function fetchGlobalSlots() {
      const res = await fetch('/api/global-timeslots');
      const data = await res.json();
      setGlobalSlots(Array.isArray(data) ? data : []);
    }
    fetchGlobalSlots();
  }, [message]);

  // Fetch overrides for selected date
  useEffect(() => {
    if (!overrideDate) return setOverrideSlots({});
    setOverrideLoading(true);
    fetch(`/api/date-overrides?date=${overrideDate}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const slots: { [time: string]: boolean } = {};
          data.forEach(o => { slots[o.time] = o.available; });
          setOverrideSlots(slots);
        } else {
          setOverrideSlots({});
        }
      })
      .finally(() => setOverrideLoading(false));
  }, [overrideDate, message]);

  // Update selectedSlots when weekday changes or globalSlots change
  useEffect(() => {
    const slots = globalSlots.filter(s => s.weekday === selectedWeekday).map(s => s.time);
    setSelectedSlots(slots);
  }, [selectedWeekday, globalSlots]);

  // Update selectedSlots when configuration changes
  useEffect(() => {
    // Clear selected slots when configuration changes, don't auto-select
    setSelectedSlots([]);
  }, [currentSlotConfig, currentStartHour, currentEndHour]);

  // Toggle slot
  function toggleSlot(time: string) {
    setSelectedSlots(slots =>
      slots.includes(time) ? slots.filter(t => t !== time) : [...slots, time]
    );
  }

  // Toggle override slot
  function toggleOverrideSlot(time: string) {
    setOverrideSlots(slots => ({ ...slots, [time]: !slots[time] }));
  }

  // Save slots for weekday
  async function handleSaveGlobalSlots() {
    // Ensure correct weekday index (0=Sunday, 1=Monday, ..., 6=Saturday)
    const weekday = selectedWeekday;
    
    // Debug: Log what's being saved
    console.log('Saving slots for weekday:', weekday);
    console.log('Current configuration:', currentSlotConfig, currentStartHour, currentEndHour);
    console.log('Selected slots to save:', selectedSlots);
    
    // Save ONLY the selected slots for this weekday
    await fetch('/api/global-timeslots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        weekday, 
        slots: selectedSlots.map(time => ({ time, service: '' })) 
      }),
    });
    
    // Refresh global slots to show the updated configuration
    const res = await fetch('/api/global-timeslots');
    const data = await res.json();
    setGlobalSlots(Array.isArray(data) ? data : []);
    
    setMessage(`Αποθηκεύτηκαν ${selectedSlots.length} επιλεγμένα slots για ${WEEKDAYS[weekday]}!`);
  }

  // Apply current configuration to all weekdays
  async function handleApplyToAllWeekdays() {
    if (!confirm('Θέλετε να εφαρμόσετε την τρέχουσα ρύθμιση σε όλες τις ημέρες της εβδομάδας;')) {
      return;
    }
    
    if (selectedSlots.length === 0) {
      setMessage('Παρακαλώ επιλέξτε πρώτα τα slots που θέλετε να εφαρμόσετε!');
      return;
    }
    
    setMessage('Εφαρμογή επιλεγμένων slots σε όλες τις ημέρες...');
    
    // Apply to all weekdays (0=Sunday, 1=Monday, ..., 6=Saturday)
    for (let weekday = 0; weekday < 7; weekday++) {
      // Skip weekends (Saturday=6, Sunday=0) if you want
      if (weekday === 0 || weekday === 6) continue; // Skip weekends
      
      await fetch('/api/global-timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weekday, 
          slots: selectedSlots.map(time => ({ time, service: '' })) 
        }),
      });
    }
    
    // Refresh global slots to show the updated configuration
    const res = await fetch('/api/global-timeslots');
    const data = await res.json();
    setGlobalSlots(Array.isArray(data) ? data : []);
    
    setMessage(`Εφαρμόστηκαν ${selectedSlots.length} επιλεγμένα slots σε όλες τις εργάσιμες ημέρες!`);
  }

  // Clear all time slots for all weekdays
  async function handleClearAllSlots() {
    if (!confirm('Θέλετε να διαγράψετε όλα τα time slots για όλες τις ημέρες; Αυτό θα αφαιρέσει όλες τις διαθεσιμότητες.')) {
      return;
    }
    
    setMessage('Διαγραφή όλων των time slots...');
    
    // Clear all weekdays (0=Sunday, 1=Monday, ..., 6=Saturday)
    for (let weekday = 0; weekday < 7; weekday++) {
      await fetch('/api/global-timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weekday, 
          slots: [] // Empty array clears all slots
        }),
      });
    }
    
    // Refresh global slots to show the updated configuration
    const res = await fetch('/api/global-timeslots');
    const data = await res.json();
    setGlobalSlots(Array.isArray(data) ? data : []);
    
    // Clear selected slots
    setSelectedSlots([]);
    
    setMessage('Όλα τα time slots διαγράφηκαν!');
  }

  // Save overrides
  async function handleSaveOverrides() {
    const overrides = Object.entries(overrideSlots).map(([time, available]) => ({ time, service: '', available }));
    await fetch('/api/date-overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: overrideDate, overrides }),
    });
    setMessage('Τα overrides αποθηκεύτηκαν!');
  }

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

  // Blocked dates functions
  async function fetchBlockedDates() {
    setBlockedDatesLoading(true);
    try {
      const response = await fetch('/api/blocked-dates?all=true');
      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data.map((item: any) => item.date));
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
    setBlockedDatesLoading(false);
  }

  async function handleAddBlockedDate() {
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
      } else {
        setMessage('Σφάλμα κατά την αποκλεισμό της ημερομηνίας.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την αποκλεισμό της ημερομηνίας.');
    }
    setBlockedDatesLoading(false);
  }

  async function handleRemoveBlockedDate(date: string) {
    setBlockedDatesLoading(true);
    try {
      const response = await fetch(`/api/blocked-dates?date=${date}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setBlockedDates(blockedDates.filter(d => d !== date));
        setMessage('Η ημερομηνία ξεαποκλείστηκε!');
      } else {
        setMessage('Σφάλμα κατά την ξεαποκλεισμό της ημερομηνίας.');
      }
    } catch (error) {
      setMessage('Σφάλμα κατά την ξεαποκλεισμό της ημερομηνίας.');
    }
    setBlockedDatesLoading(false);
  }

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

        {/* Schedule Section */}
        {activeTab === 'schedule' && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 sm:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Διαχείριση Διαθεσιμότητας</h2>
          <a 
            href="/admin/history" 
            className="bg-gray-200 hover:bg-gray-300 text-black font-bold px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
          >
            📊 Booking History
          </a>
        </div>
            <div className="bg-gray-100 border border-orange-200 rounded-lg p-4 sm:p-6 mb-6">
              {/* Global Timeslot Management */}
              <div className="mb-8">
                <div className="mb-4 font-bold text-black text-lg">Default slots ανά ημέρα</div>
                
                {/* Dynamic Time Slot Configuration */}
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Ρύθμιση Διαστήματος Ώρας</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {Object.entries(SLOT_CONFIGS).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          // Update current configuration
                          setCurrentSlotConfig(key);
                          // Clear selected slots when changing configuration
                          setSelectedSlots([]);
                          // Force re-render by updating a state variable
                          setRefreshKey(prev => prev + 1);
                        }}
                        className={`p-3 rounded-lg border transition ${
                          key === DEFAULT_SLOT_CONFIG 
                            ? 'bg-orange-200 border-orange-400 text-black shadow-md' 
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-bold text-sm">{config.label}</div>
                        <div className="text-xs text-gray-600">
                          {key === '45min' ? '9:00-9:45, 9:45-10:30...' :
                           key === '30min' ? '9:00-9:30, 9:30-10:00...' :
                           key === '1hour' ? '9:00-10:00, 10:00-11:00...' :
                           '9:00-10:30, 10:30-12:00...'}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Τρέχουσα ρύθμιση:</strong> {SLOT_CONFIGS[currentSlotConfig].label} 
                    (από {currentStartHour}:00 έως {currentEndHour}:00)
                  </div>
                  
                  {/* Debug: Show generated slots */}
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <div className="text-sm font-semibold mb-2">Generated Slots Preview:</div>
                    <div className="text-xs text-gray-600 mb-2">
                      {getCurrentTimeSlots().slice(0, 5).join(', ')}...
                    </div>
                    <button
                      onClick={() => {
                        const allSlots = getCurrentTimeSlots();
                        setSelectedSlots(allSlots);
                      }}
                      className="px-3 py-1 bg-green-200 hover:bg-green-300 text-black text-xs rounded transition"
                    >
                      Επιλογή Όλων (Select All)
                    </button>
                  </div>
                  
                  {/* Business Hours Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Έναρξη Εργασίας:</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={currentStartHour}
                        onChange={(e) => {
                          const hour = parseInt(e.target.value);
                          setCurrentStartHour(hour);
                          // Clear selected slots when changing hours
                          setSelectedSlots([]);
                          setRefreshKey(prev => prev + 1);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Λήξη Εργασίας:</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={currentEndHour}
                        onChange={(e) => {
                          const hour = parseInt(e.target.value);
                          setCurrentEndHour(hour);
                          // Clear selected slots when changing hours
                          setSelectedSlots([]);
                          setRefreshKey(prev => prev + 1);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Weekday Selection - Mobile Responsive */}
                <div className="mb-6">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                    {WEEKDAYS.map((d, i) => (
                      <button
                        key={d}
                        className={`px-2 sm:px-3 py-2 sm:py-3 rounded-lg font-bold border transition text-sm sm:text-base ${selectedWeekday === i ? 'bg-orange-200 border-orange-400 text-black shadow-md' : 'bg-white border-gray-300 text-black hover:bg-gray-50'}`}
                        onClick={() => setSelectedWeekday(i)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots - Mobile Responsive */}
                <div className="mb-6">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
                    {getCurrentTimeSlots().map(time => (
                      <button
                        key={time}
                        className={`px-2 py-3 rounded-lg border font-bold text-sm transition text-black min-h-[44px] ${selectedSlots.includes(time) ? 'bg-orange-200 border-orange-400 shadow-md' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => toggleSlot(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handleSaveGlobalSlots} 
                      className="w-full sm:w-auto bg-orange-200 hover:bg-orange-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      Αποθήκευση για {WEEKDAYS[selectedWeekday]}
                    </button>
                    <button 
                      onClick={handleApplyToAllWeekdays} 
                      className="w-full sm:w-auto bg-blue-200 hover:bg-blue-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      Εφαρμογή σε Όλες τις Ημέρες
                    </button>
                    <button 
                      onClick={handleClearAllSlots} 
                      className="w-full sm:w-auto bg-red-200 hover:bg-red-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      Καθαρισμός Όλων
                    </button>
                  </div>
                </div>
              </div>

              {/* Date-specific Overrides */}
              <div className="border-t border-gray-300 pt-6">
                <div className="mb-4 font-bold text-black text-lg">Overrides για συγκεκριμένη ημερομηνία</div>
                
                {/* Date Input - Mobile Responsive */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Επιλέξτε ημερομηνία:</label>
                  <input 
                    type="date" 
                    value={overrideDate} 
                    onChange={e => setOverrideDate(e.target.value)} 
                    className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition" 
                  />
                </div>

                {overrideDate && (
                  <>
                    {overrideLoading ? (
                      <div className="text-black text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                        Φόρτωση...
                      </div>
                    ) : (
                      <>
                        {/* Override Time Slots - Mobile Responsive */}
                        <div className="mb-6">
                                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
                          {getCurrentTimeSlots().map(time => (
                              <button
                                key={time}
                                className={`px-2 py-3 rounded-lg border font-bold text-sm transition text-black min-h-[44px] ${overrideSlots[time] ? 'bg-orange-200 border-orange-400 shadow-md' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                onClick={() => toggleOverrideSlot(time)}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                          <button 
                            onClick={handleSaveOverrides} 
                            className="w-full sm:w-auto bg-orange-200 hover:bg-orange-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
                          >
                            Αποθήκευση για {overrideDate}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overrides Section */}
        {activeTab === 'overrides' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 px-8">Όλα τα Overrides</h2>
            <OverridesTable />
          </div>
        )}

        {/* Blocked Dates Section */}
        {activeTab === 'blocked' && (
          <div className="mb-8 px-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Αποκλεισμένες Ημερομηνίες</h2>
            
            {/* Add New Blocked Date */}
            <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Προσθήκη Αποκλεισμένης Ημερομηνίας</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ημερομηνία:</label>
                  <input 
                    type="date" 
                    value={newBlockedDate} 
                    onChange={e => setNewBlockedDate(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition" 
                  />
                </div>
                <button 
                  onClick={handleAddBlockedDate}
                  disabled={!newBlockedDate || blockedDatesLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {blockedDatesLoading ? 'Προσθήκη...' : 'Αποκλεισμός'}
                </button>
              </div>
            </div>

            {/* List of Blocked Dates */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Αποκλεισμένες Ημερομηνίες</h3>
                <p className="text-sm text-gray-600 mt-1">Οι ημερομηνίες που έχουν αποκλειστεί για κρατήσεις</p>
              </div>
              
              {blockedDatesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                  <p className="text-gray-600">Φόρτωση...</p>
                </div>
              ) : blockedDates.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Δεν υπάρχουν αποκλεισμένες ημερομηνίες</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {blockedDates.sort().map((date, index) => (
                    <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
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
                        className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Αφαίρεση
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

// Show all date-specific overrides in a table
import { useEffect as useOverridesEffect, useState as useOverridesState } from 'react';
function OverridesTable() {
  const [overrides, setOverrides] = useOverridesState<any[]>([]);
  const [loading, setLoading] = useOverridesState(true);
  const [error, setError] = useOverridesState('');
  useOverridesEffect(() => {
    async function fetchOverrides() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/date-overrides?all=1');
        const data = await res.json();
        if (Array.isArray(data)) setOverrides(data);
        else setError(data.error || 'Σφάλμα φόρτωσης overrides.');
      } catch {
        setError('Σφάλμα φόρτωσης overrides.');
      } finally {
        setLoading(false);
      }
    }
    fetchOverrides();
  }, []);
  if (loading) return <div className="p-8 text-center text-black">Φόρτωση overrides...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  const filteredOverrides = overrides.filter(o => {
    if (!o.date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const overrideDate = new Date(o.date);
    overrideDate.setHours(0,0,0,0);
    return overrideDate >= today;
  });
  if (filteredOverrides.length === 0) return <div className="p-8 text-center text-black">Δεν υπάρχουν overrides.</div>;
  return (
    <div className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 px-8 pt-6">Όλα τα Overrides</h2>
      <table className="w-full text-base border-separate border-spacing-y-2">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="py-3 px-2 text-left font-bold">Ημερομηνία</th>
            <th className="py-3 px-2 text-left font-bold">Ώρα</th>
            <th className="py-3 px-2 text-left font-bold">Διαθέσιμο</th>
          </tr>
        </thead>
        <tbody>
          {filteredOverrides.map((o, i) => (
            <tr key={o.date + o.time + i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-2 px-2">{o.date}</td>
              <td className="py-2 px-2">{o.time}</td>
              <td className="py-2 px-2">{o.available ? 'Ναι' : 'Όχι'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 