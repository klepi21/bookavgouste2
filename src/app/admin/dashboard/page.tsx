"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { el as elGR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const WEEKDAYS = [
  'Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'
];
const HOUR_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
});

const locales = {
  'el': elGR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Helper for Greek time labels with AM/PM
function greekTimeLabel(date: Date) {
  let hour = date.getHours();
  const minute = date.getMinutes();
  const isAM = hour < 12;
  const suffix = isAM ? 'π.μ.' : 'μ.μ.';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

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

  // Map bookings to calendar events
  const calendarEvents = bookings.map(b => {
    // If time is a range, use the start time; if not, use as is
    let startTime = b.time;
    if (b.time && b.time.includes('-')) startTime = b.time.split('-')[0].trim();
    const [hour, minute] = startTime.split(':');
    const start = new Date(b.date);
    start.setHours(Number(hour), Number(minute || 0));
    // End time: if range, use end; else, add 1 hour
    let end = new Date(b.date);
    if (b.time && b.time.includes('-')) {
      const endTime = b.time.split('-')[1].trim();
      const [eh, em] = endTime.split(':');
      end.setHours(Number(eh), Number(em || 0));
    } else {
      end.setHours(Number(hour) + 1, Number(minute || 0));
    }
    return {
      ...b,
      title: b.name,
      start,
      end,
      allDay: false,
    };
  });

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      <header className="w-full flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <button onClick={handleLogout} className="bg-orange-200 hover:bg-orange-300 text-black font-bold px-5 py-2 rounded-lg transition text-base">Αποσύνδεση</button>
      </header>
      <section className="w-full max-w-6xl mx-auto py-8 px-4">
        {message && <div className="mb-4 text-center text-green-700 font-bold text-lg">{message}</div>}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Κρατήσεις</h2>
          <button onClick={() => setShowBookingModal(true)} className="bg-black text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition">+ Νέα Κράτηση</button>
        </div>
        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl" onClick={() => setShowBookingModal(false)}>&times;</button>
              <h3 className="text-xl font-bold mb-4">Νέα Κράτηση</h3>
              <form className="space-y-4" onSubmit={handleCreateBooking}>
                <div>
                  <label className="block font-semibold mb-1">Υπηρεσία</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newBooking.service} onChange={e => setNewBooking({ ...newBooking, service: e.target.value })} required />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1">Ημερομηνία</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={newBooking.date} onChange={e => setNewBooking({ ...newBooking, date: e.target.value })} required />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-1">Ώρα</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newBooking.time} onChange={e => setNewBooking({ ...newBooking, time: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Όνομα</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newBooking.name} onChange={e => setNewBooking({ ...newBooking, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Τηλέφωνο</label>
                  <input type="tel" className="w-full border rounded px-3 py-2" value={newBooking.telephone} onChange={e => setNewBooking({ ...newBooking, telephone: e.target.value })} required />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input type="email" className="w-full border rounded px-3 py-2" value={newBooking.email} onChange={e => setNewBooking({ ...newBooking, email: e.target.value })} required />
                </div>
                {bookingError && <div className="text-red-600 text-sm font-bold">{bookingError}</div>}
                <button type="submit" className="w-full bg-black text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition" disabled={bookingLoading}>{bookingLoading ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
              </form>
            </div>
          </div>
        )}
        <div className="mb-8 bg-white rounded-2xl shadow p-4">
          <h2 className="text-2xl font-bold mb-4 text-black">Ημερολόγιο Κρατήσεων</h2>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={['month', 'week']}
            defaultView="month"
            popup
            messages={{
              month: 'Μήνας',
              week: 'Εβδομάδα',
              today: 'Σήμερα',
              previous: 'Προηγούμενος',
              next: 'Επόμενος',
              showMore: (total: number) => `+${total} ακόμα`,
            }}
            min={new Date(1970, 1, 1, 9, 0, 0)}
            max={new Date(1970, 1, 1, 21, 0, 0)}
            timeslots={1}
            step={60}
            formats={{
              timeGutterFormat: greekTimeLabel,
            }}
            eventPropGetter={() => ({ style: { background: '#FBDAC6', color: '#222', borderRadius: 8, border: 'none', fontWeight: 600 } })}
            onSelectEvent={event => setSelectedEvent(event)}
          />
          {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl" onClick={() => setSelectedEvent(null)}>&times;</button>
                <h3 className="text-xl font-bold mb-4">Λεπτομέρειες Κράτησης</h3>
                <div className="space-y-2 text-black text-base">
                  <div><span className="font-semibold">Όνομα:</span> {selectedEvent.name}</div>
                  <div><span className="font-semibold">Υπηρεσία:</span> {selectedEvent.service}</div>
                  <div><span className="font-semibold">Ημερομηνία:</span> {selectedEvent.date}</div>
                  <div><span className="font-semibold">Ώρα:</span> {formatGreekTime(selectedEvent.time)}</div>
                  <div><span className="font-semibold">Τηλέφωνο:</span> {selectedEvent.telephone}</div>
                  <div><span className="font-semibold">Email:</span> {selectedEvent.email}</div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    className="bg-red-100 text-red-700 font-bold px-4 py-2 rounded hover:bg-red-200 transition"
                    onClick={() => setSelectedEvent({ ...selectedEvent, confirm: 'cancel' })}
                  >
                    Ακύρωση
                  </button>
                  <button
                    className="bg-orange-100 text-orange-700 font-bold px-4 py-2 rounded hover:bg-orange-200 transition"
                    onClick={() => setSelectedEvent({ ...selectedEvent, confirm: 'edit' })}
                  >
                    Επεξεργασία
                  </button>
                </div>
                {/* Confirmation Dialogs */}
                {selectedEvent.confirm === 'cancel' && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
                      <div className="mb-4 text-black font-bold">Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτή την κράτηση;</div>
                      <div className="flex gap-3 justify-end">
                        <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setSelectedEvent({ ...selectedEvent, confirm: undefined })}>Όχι</button>
                        <button className="px-4 py-2 rounded bg-red-500 text-white" onClick={() => handleCancelBooking(selectedEvent._id)}>Ναι, ακύρωση</button>
                      </div>
                    </div>
                  </div>
                )}
                {selectedEvent.confirm === 'edit' && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
                      <div className="mb-4 text-black font-bold">Επεξεργασία κράτησης</div>
                      {/* Controlled edit form for booking */}
                      {(() => {
                        const [editDate, setEditDate] = useState(selectedEvent.date);
                        const [editTime, setEditTime] = useState(selectedEvent.time);
                        const [saving, setSaving] = useState(false);
                        return (
                          <form
                            className="space-y-3"
                            onSubmit={async e => {
                              e.preventDefault();
                              if (!editDate || !editTime) return;
                              setSaving(true);
                              const res = await fetch(`/api/bookings-list?id=${selectedEvent._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ date: editDate, time: editTime }),
                              });
                              const data = await res.json();
                              setSaving(false);
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
                            <div>
                              <label className="block font-semibold mb-1">Ημερομηνία</label>
                              <input
                                type="date"
                                name="date"
                                className="w-full border rounded px-3 py-2"
                                value={editDate}
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
                                value={editTime}
                                onChange={e => setEditTime(e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex gap-3 justify-end mt-4">
                              <button
                                type="button"
                                className="px-4 py-2 rounded bg-gray-200"
                                onClick={() => setSelectedEvent({ ...selectedEvent, confirm: undefined })}
                                disabled={saving}
                              >Άκυρο</button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded bg-orange-500 text-white font-bold"
                                disabled={saving || !editDate || !editTime}
                              >{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</button>
                            </div>
                          </form>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white">
          {bookingsLoading ? (
            <div className="p-8 text-center text-black">Φόρτωση...</div>
          ) : bookingsError ? (
            <div className="p-8 text-center text-red-600">{bookingsError}</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-black">Δεν υπάρχουν κρατήσεις.</div>
          ) : (
            <table className="w-full text-base border-separate border-spacing-y-2">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="py-3 px-2 text-left font-bold">Υπηρεσία</th>
                  <th className="py-3 px-2 text-left font-bold">Ημερομηνία</th>
                  <th className="py-3 px-2 text-left font-bold">Ώρα</th>
                  <th className="py-3 px-2 text-left font-bold">Όνομα</th>
                  <th className="py-3 px-2 text-left font-bold">Τηλέφωνο</th>
                  <th className="py-3 px-2 text-left font-bold">Email</th>
                  <th className="py-3 px-2 text-left font-bold">Ενέργεια</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b._id} className={i % 2 === 0 ? 'bg-gray-50 hover:bg-orange-50 transition' : 'bg-white hover:bg-orange-50 transition'}>
                    <td className="py-2 px-2 rounded-l-xl">{b.service}</td>
                    <td className="py-2 px-2">{b.date}</td>
                    <td className="py-2 px-2">{formatGreekTime(b.time)}</td>
                    <td className="py-2 px-2">{b.name}</td>
                    <td className="py-2 px-2">{b.telephone}</td>
                    <td className="py-2 px-2">{b.email}</td>
                    <td className="py-2 px-2 rounded-r-xl">
                      <button onClick={() => handleCancelBooking(b._id)} className="text-red-600 hover:underline font-bold">Ακύρωση</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <div>
        <h2 className="text-lg font-bold mb-2 text-black">Διαχείριση Διαθεσιμότητας</h2>
        <div className="bg-gray-100 border border-orange-200 rounded p-4 mb-4">
          {/* Global Timeslot Management */}
          <div className="mb-6">
            <div className="mb-2 font-bold text-black">Default slots ανά ημέρα</div>
            <div className="flex gap-2 mb-4">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  className={`px-3 py-1 rounded font-bold border transition ${selectedWeekday === i ? 'bg-orange-200 border-orange-400 text-black' : 'bg-white border-gray-300 text-black'}`}
                  onClick={() => setSelectedWeekday(i)}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
              {HOUR_SLOTS.map(time => (
                <button
                  key={time}
                  className={`px-2 py-2 rounded border font-bold text-sm transition text-black ${selectedSlots.includes(time) ? 'bg-orange-200 border-orange-400' : 'bg-white border-gray-300'}`}
                  onClick={() => toggleSlot(time)}
                >
                  {time}
                </button>
              ))}
            </div>
            <button onClick={handleSaveGlobalSlots} className="bg-orange-200 hover:bg-orange-300 text-black font-bold px-4 py-2 rounded transition">Αποθήκευση για {WEEKDAYS[selectedWeekday]}</button>
          </div>
          {/* Date-specific Overrides */}
          <div className="mb-6">
            <div className="mb-2 font-bold text-black">Overrides για συγκεκριμένη ημερομηνία</div>
            <input type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} className="border rounded px-2 py-1 text-black mb-2" />
            {overrideDate && (
              <>
                {overrideLoading ? (
                  <div className="text-black">Φόρτωση...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                      {HOUR_SLOTS.map(time => (
                        <button
                          key={time}
                          className={`px-2 py-2 rounded border font-bold text-sm transition text-black ${overrideSlots[time] ? 'bg-orange-200 border-orange-400' : 'bg-white border-gray-300'}`}
                          onClick={() => toggleOverrideSlot(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleSaveOverrides} className="bg-orange-200 hover:bg-orange-300 text-black font-bold px-4 py-2 rounded transition">Αποθήκευση για {overrideDate}</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 