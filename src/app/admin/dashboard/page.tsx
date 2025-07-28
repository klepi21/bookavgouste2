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

// Generate time slots from 09:00 to 21:00 with 30-minute intervals
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});
const HOUR_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
});

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
    await fetch('/api/global-timeslots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekday, slots: selectedSlots.map(time => ({ time, service: '' })) }),
    });
    setMessage('Τα default slots αποθηκεύτηκαν!');
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800 px-4 sm:px-8">Διαχείριση Διαθεσιμότητας</h2>
            <div className="bg-gray-100 border border-orange-200 rounded-lg p-4 sm:p-6 mb-6">
              {/* Global Timeslot Management */}
              <div className="mb-8">
                <div className="mb-4 font-bold text-black text-lg">Default slots ανά ημέρα</div>
                
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
                    {HOUR_SLOTS.map(time => (
                      <button
                        key={time}
                        className={`px-2 py-3 rounded-lg border font-bold text-sm transition text-black min-h-[44px] ${selectedSlots.includes(time) ? 'bg-orange-200 border-orange-400 shadow-md' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => toggleSlot(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleSaveGlobalSlots} 
                    className="w-full sm:w-auto bg-orange-200 hover:bg-orange-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
                  >
                    Αποθήκευση για {WEEKDAYS[selectedWeekday]}
                  </button>
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
                            {HOUR_SLOTS.map(time => (
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
                <div>
                  <label className="block font-semibold mb-1">Τηλέφωνο</label>
                  <input type="tel" className="w-full border rounded px-3 py-2" value={newBooking.telephone} onChange={e => setNewBooking({ ...newBooking, telephone: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input type="email" className="w-full border rounded px-3 py-2" value={newBooking.email} onChange={e => setNewBooking({ ...newBooking, email: e.target.value })} />
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