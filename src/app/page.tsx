"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { UserIcon, PhoneIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import ClientWrapper from '@/components/ClientWrapper';

const SERVICES = [
  { label: 'Απλή επίσκεψη', duration: '60 λεπτά' },
  { label: 'Αντιμετώπιση μυοσκελετικού πόνου', duration: '40 λεπτά' },
  { label: 'Αντιμετώπιση κεφαλαγίας - ημικρανίας', duration: '30 λεπτά' },
  { label: 'Αντιμετώπιση αυχενικού συνδρόμου', duration: '40 λεπτά' },
  { label: 'Αντιμετώπιση οσφυαλγίας', duration: '40 λεπτά' },
  { label: 'Αντιμετώπιση άγχους', duration: '40 λεπτά' },
  { label: 'Διακοπή καπνίσματος', duration: '30 λεπτά' },
  { label: 'Αντιμετώπιση δυσμηνόρροιας', duration: '40 λεπτά' },
  { label: 'Αντιμετώπιση Παχυσαρκίας', duration: '40 λεπτά' },
  { label: 'Θεραπευτική Συνεδρία', duration: '40 λεπτά' },
];

function UserBookingPageContent() {
  const [form, setForm] = useState({
    service: SERVICES[0].label,
    date: '',
    time: '',
    name: '',
    telephone: '',
    email: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [globalSlots, setGlobalSlots] = useState<{ weekday: number; time: string; service?: string }[]>([]); // all global timeslots for the week
  const [timeslots, setTimeslots] = useState<string[] | null>(null); // slots for selected date
  const [timeslotLoading, setTimeslotLoading] = useState(false);
  const [timeslotError, setTimeslotError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [animatedIdx, setAnimatedIdx] = useState<number | null>(null);
  const bounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current announcement
  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data = await response.json();
          setAnnouncement(data);
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      }
    }
    fetchAnnouncement();
  }, []);

  // Fetch blocked dates
  useEffect(() => {
    async function fetchBlockedDates() {
      try {
        const response = await fetch('/api/blocked-dates?all=true');
        if (response.ok) {
          const data = await response.json();
          setBlockedDates(data.map((item: any) => item.date));
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    }
    fetchBlockedDates();
  }, []);

  const days = useMemo(() => {
    if (!mounted) return [];
    const days = [];
    const today = new Date();
    let added = 0;
    let i = 0;
    while (added < 25) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateString = date.toISOString().split('T')[0];
        // Skip blocked dates
        if (!blockedDates.includes(dateString)) {
          days.push({
            date,
            label: date.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'short' }),
            value: dateString,
          });
          added++;
        }
      }
      i++;
    }
    return days;
  }, [mounted, blockedDates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBookClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: form.service,
          date: form.date,
          time: form.time,
          name: form.name,
          telephone: form.telephone,
          email: form.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Η κράτησή σας καταχωρήθηκε με επιτυχία!');
        setForm({ service: '', date: '', time: '', name: '', telephone: '', email: '' });
        setTimeout(() => {
          setShowModal(false);
          setMessage(null);
          setConfirmationModal(true);
        }, 1200);
      } else {
        // Handle specific blocked date error
        if (data.error && data.error.includes('αποκλειστεί')) {
          setMessage('Η επιλεγμένη ημερομηνία έχει αποκλειστεί για κρατήσεις. Παρακαλώ επιλέξτε άλλη ημερομηνία.');
        } else {
          setMessage(data.error || 'Σφάλμα κατά την αποθήκευση της κράτησης.');
        }
      }
    } catch (err) {
      setMessage('Σφάλμα κατά την αποθήκευση της κράτησης.');
    } finally {
      setLoading(false);
    }
  };

  // Preload all global timeslots for the week on mount
  useEffect(() => {
    async function fetchGlobalSlots() {
      try {
        const res = await fetch('/api/global-timeslots');
        const data = await res.json();
        if (Array.isArray(data)) setGlobalSlots(data);
        else setGlobalSlots([]);
      } catch {
        setGlobalSlots([]);
      }
    }
    fetchGlobalSlots();
  }, []);

  // When date changes, instantly show possible slots for that weekday from preloaded globalSlots, then fetch overrides
  useEffect(() => {
    if (!form.date) {
      setTimeslots(null);
      return;
    }
    setTimeslotLoading(true);
    setTimeslotError(null);
    // JS getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    const weekday = new Date(form.date).getDay();
    // Show global slots for this weekday instantly
    const slots = globalSlots.filter((s) => Number(s.weekday) === Number(weekday)).map((s) => s.time);
    setTimeslots((slots.length > 0 ? slots : []).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
    // Now fetch date-specific overrides and update if needed
    async function fetchOverrides() {
      try {
        const overrideRes = await fetch(`/api/date-overrides?date=${form.date}`);
        const overrideData = await overrideRes.json();
        if (Array.isArray(overrideData) && overrideData.some((o: { available: boolean }) => o.available)) {
          // Only show slots marked available
          const available = overrideData.filter((o: { available: boolean }) => o.available).map((o: { time: string }) => o.time);
          setTimeslots((available.length > 0 ? available : []).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
        }
      } catch (err) {
        setTimeslotError('Σφάλμα κατά τη φόρτωση των διαθέσιμων ωρών.');
      } finally {
        setTimeslotLoading(false);
      }
    }
    fetchOverrides();
  }, [form.date, globalSlots, refreshKey]);

  // Filter out past slots if selected date is today
  const filteredTimeslots = useMemo(() => {
    if (!form.date || !timeslots) return timeslots;
    const today = new Date();
    const selected = new Date(form.date);
    if (
      today.getFullYear() === selected.getFullYear() &&
      today.getMonth() === selected.getMonth() &&
      today.getDate() === selected.getDate()
    ) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      return timeslots.filter(t => {
        const [h, m] = t.split(':');
        const slotMinutes = parseInt(h) * 60 + parseInt(m);
        return slotMinutes > nowMinutes;
      });
    }
    return timeslots;
  }, [form.date, timeslots]);

  // Fetch booked slots for the selected date (ignore service)
  useEffect(() => {
    if (!form.date) {
      setBookedSlots([]);
      return;
    }
    async function fetchBookedSlots() {
      try {
        const res = await fetch('/api/bookings-list');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Only bookings for the selected date, extract start time from each booking's time
          const booked = data
            .filter((b: { date: string }) => b.date === form.date)
            .map((b: { time: string }) => b.time && b.time.split(/\s|-/)[0]);
          setBookedSlots(booked);
        } else {
          setBookedSlots([]);
        }
      } catch {
        setBookedSlots([]);
      }
    }
    fetchBookedSlots();
  }, [form.date]);

  useEffect(() => {
    return () => {
      if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
    };
  }, []);

  function formatDateClient(dateStr: string, options: Intl.DateTimeFormatOptions) {
    if (!mounted) return dateStr;
    const d = new Date(dateStr);
    return d.toLocaleDateString('el-GR', options);
  }

  if (!mounted) return null;
  return (
    <>
      {/* Modern Centered Navbar with Logo */}
      <nav className="w-full flex items-center justify-center" style={{ height: 72, background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <Image
          src="/image.png"
          alt="Logo"
          width={110}
          height={110}
          style={{ objectFit: 'contain', filter: 'brightness(0) invert(0) drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
          priority
        />
      </nav>
      <main
        style={{
          backgroundColor: '#DFE7CA',
          backgroundImage: "url('/pattern.webp')",
          backgroundRepeat: 'repeat',
          backgroundSize: '300px',
          minHeight: '100vh',
          position: 'relative',
        }}
        className="flex flex-col items-center py-8 px-2 sm:px-4"
      >
        {/* Overlay for lower pattern opacity */}
        <div style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: '#DFE7CA',
          opacity: 0.95,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        {/* Welcome Section */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3 text-3xl" role="img" aria-label="leaf">🍃</div>
            <div className="text-lg font-bold text-black mb-1 text-center">Δώσε προτεραιότητα σε εσένα!</div>
            <div className="text-sm text-gray-700 text-center">Ανακάλυψε τα σημάδια που σου δείχνει το σώμα σου</div>
          </div>
        </div>

        {/* Announcement Display */}
        {announcement && (
          <div style={{ position: 'relative', zIndex: 1 }} className="w-full max-w-md mb-4">
            <div className={`px-4 py-3 rounded-lg border ${
              announcement.type === 'info' ? 'bg-blue-50 border-blue-200' :
              announcement.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              announcement.type === 'success' ? 'bg-green-50 border-green-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  announcement.type === 'info' ? 'bg-blue-500' :
                  announcement.type === 'warning' ? 'bg-yellow-500' :
                  announcement.type === 'success' ? 'bg-green-500' :
                  'bg-red-500'
                }`}></div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {announcement.message}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md flex flex-col gap-0 border-2" style={{ borderColor: '#B5C99A', position: 'relative', zIndex: 1 }}>
          {/* Service Selection as Cards */}
          <div className="mb-6">
            <label className="block mb-2 text-lg font-extrabold text-black">Υπηρεσία</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {SERVICES.map((service, idx) => (
                <button
                  key={service.label}
                  type="button"
                  className={`flex flex-col items-start justify-center px-3 py-1 rounded-lg border transition min-w-[180px] h-[68px] ${form.service === service.label ? 'bg-[#DFE7CA] border-[#DFE7CA]' : 'bg-gray-50 border-gray-200'}`}
                  onClick={() => {
                    setForm({ ...form, service: service.label });
                    setAnimatedIdx(idx);
                    if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
                    bounceTimeout.current = setTimeout(() => setAnimatedIdx(null), 2000);
                  }}
                >
                  <div className="flex items-center w-full h-[36px]">
            <Image
                      src={`/${idx + 1}.png`}
                      alt="service"
                      className={`h-12 w-12 object-contain mr-3 flex-shrink-0 transition-transform duration-300 ${animatedIdx === idx ? 'animate-bounce' : ''}`}
                      style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))' }}
                      width={64}
                      height={64}
            />
                    <span className="text-black font-bold text-xs text-left flex-1 break-words leading-tight">{service.label}</span>
                  </div>
                  <span className="text-xs text-black font-normal mt-0.5 ml-1 w-full truncate">{service.duration}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="border-b border-gray-200 my-4" />
          {/* Date Picker Horizontal */}
          <div className="mb-6">
            <label className="block mb-2 text-lg font-extrabold text-black">Ημερομηνία</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.length === 0 ? (
                <div className="w-full text-center py-4">
                  <div className="text-red-600 font-bold mb-2">Δεν υπάρχουν διαθέσιμες ημερομηνίες</div>
                  <div className="text-sm text-gray-600">Όλες οι ημερομηνίες έχουν αποκλειστεί για κρατήσεις</div>
                </div>
              ) : (
                days.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border transition min-w-[70px] ${form.date === d.value ? 'bg-[#DFE7CA] border-[#DFE7CA]' : 'bg-gray-50 border-gray-200'}`}
                    onClick={() => {
                      setForm(f => ({ ...f, date: d.value, time: '' }));
                      setRefreshKey(k => k + 1);
                    }}
                  >
                    <span className="font-bold text-black">{d.label.split(' ')[1]}</span>
                    <span className="text-xs text-black font-semibold">{d.label.split(' ')[0]}</span>
                    <span className="text-xs text-black font-semibold">{d.label.split(' ')[2]}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="border-b border-gray-200 my-4" />
          {/* Time Slots Grouped */}
          <div className="mb-6">
            <label className="block mb-2 text-lg font-extrabold text-black">Ώρα</label>
            {!form.date ? (
              <div className="text-black font-bold mb-2">Επέλεξε ημερομηνία για να δεις τα διαθέσιμα ραντεβού.</div>
            ) : timeslotLoading ? (
              <div className="text-sm text-gray-500 mb-2">Φόρτωση διαθέσιμων ωρών...</div>
            ) : timeslotError ? (
              <div className="text-sm text-red-600 mb-2">{timeslotError}</div>
            ) : timeslots === null ? null : timeslots.length === 0 ? (
              <div className="text-black font-bold mb-2">Δεν υπάρχουν διαθέσιμα ραντεβού για αυτή την ημέρα.</div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {filteredTimeslots && filteredTimeslots.map(t => {
                  const [slotStart, slotEnd] = t.split('-').map(s => s.trim());
                  const isBooked = bookedSlots.some(b => {
                    if (!b) return false;
                    // If booking is a range, match start time
                    if (b.includes('-')) {
                      const bookingStart = b.split('-')[0].trim();
                      return bookingStart === slotStart;
                    }
                    // If booking is a single time, check if it falls within the slot range
                    if (slotStart && slotEnd) {
                      return b >= slotStart && b < slotEnd;
                    }
                    return false;
                  });
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`px-3 py-2 rounded-lg border transition min-w-[70px] text-black font-bold text-base m-1 ${form.time === t ? 'bg-[#DFE7CA] border-[#DFE7CA]' : 'bg-gray-50 border-gray-200'} ${isBooked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isBooked && setForm({ ...form, time: t })}
                      disabled={isBooked}
                    >
                      {slotStart}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            className="w-full text-black font-extrabold py-2 px-4 rounded-2xl transition mt-2 border"
            style={{ background: '#DFE7CA', borderColor: '#B5C99A', borderWidth: '1px' }}
            onClick={handleBookClick}
            disabled={!form.service || !form.date || !form.time}
          >
            Κάνε Κράτηση
          </button>
        </div>
        {/* Modal for Patient Info */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/40 pointer-events-auto overflow-y-auto">
            <div className="bg-white border-2 border-[#DFE7CA] rounded-2xl shadow-2xl p-4 w-full max-w-sm relative animate-fade-in">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-black"
                onClick={() => setShowModal(false)}
                aria-label="Κλείσιμο"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-extrabold mb-4 text-center text-black">Στοιχεία Επικοινωνίας</h2>
              <form className="space-y-4" onSubmit={handleModalSubmit}>
                {/* Booking Summary - visually improved */}
                <div className="mb-4 bg-[#DFE7CA] border border-[#B5C99A] rounded-xl p-3 text-black flex flex-col gap-2 shadow-sm">
                  <div className="font-bold text-base flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: '#B5C99A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c1.656 0 3-1.344 3-3s-1.344-3-3-3-3 1.344-3 3 1.344 3 3 3zm0 2c-2.67 0-8 1.337-8 4v3h16v-3c0-2.663-5.33-4-8-4z" /></svg>
                    Επιβεβαίωση Κράτησης
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 bg-white/80 border border-[#B5C99A] rounded-lg px-3 py-1 text-sm font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#B5C99A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-3-3v6" /></svg>
                      {form.service}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/80 border border-[#B5C99A] rounded-lg px-3 py-1 text-sm font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#B5C99A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {form.date && formatDateClient(form.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/80 border border-[#B5C99A] rounded-lg px-3 py-1 text-sm font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#B5C99A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3" /></svg>
                      {form.time && form.time.split(' ')[0]}
                    </span>
                  </div>
                </div>
                {/* Name Field */}
                <div className="mb-3">
                  <label htmlFor="name" className="block mb-1 text-black font-semibold text-base">Ονοματεπώνυμο</label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 pl-12 text-black font-normal placeholder-gray-400 text-base shadow focus:outline-none focus:ring-2 focus:ring-[#FBDAC6] border border-gray-200"
                      placeholder="Πληκτρολογήστε το όνομά σας"
                      required
                    />
                    <UserIcon className="h-5 w-5 absolute left-4 top-3 text-black" />
                  </div>
                </div>
                {/* Telephone Field */}
                <div className="mb-3">
                  <label htmlFor="telephone" className="block mb-1 text-black font-semibold text-base">Τηλέφωνο</label>
                  <div className="relative">
                    <input
                      id="telephone"
                      type="tel"
                      name="telephone"
                      value={form.telephone}
                      onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 pl-12 text-black font-normal placeholder-gray-400 text-base shadow focus:outline-none focus:ring-2 focus:ring-[#FBDAC6] border border-gray-200"
                      placeholder="π.χ. 6901234567"
                      required
                    />
                    <PhoneIcon className="h-5 w-5 absolute left-4 top-3 text-black" />
                  </div>
                </div>
                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="block mb-1 text-black font-semibold text-base">Email</label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-xl px-4 py-3 pl-12 text-black font-normal placeholder-gray-400 text-base shadow focus:outline-none focus:ring-2 focus:ring-[#FBDAC6] border border-gray-200"
                      placeholder="π.χ. name@email.com"
                      required
                    />
                    <EnvelopeIcon className="h-5 w-5 absolute left-4 top-3 text-black" />
                  </div>
                </div>
                {message && (
                  <div className={`text-center text-sm font-bold ${message.includes('επιτυχία') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>
                )}
                <button
                  type="submit"
                  className="w-full text-black font-extrabold py-3 px-4 rounded-xl transition mt-2 disabled:opacity-60 text-base"
                  style={{ background: '#DFE7CA', border: '1px solid #DFE7CA' }}
                  disabled={
                    loading ||
                    form.name.trim().length < 2 ||
                    !/^\d{10,}$/.test(form.telephone.replace(/\D/g, '')) ||
                    !/^\S+@\S+\.\S+$/.test(form.email)
                  }
                >
                  {loading ? 'Αποστολή...' : 'Ολοκλήρωση Κράτησης'}
                </button>
                {/* Expandable Payment/Cancellation Info - moved below submit button */}
                <Accordion />
              </form>
            </div>
          </div>
        )}
        {/* Modal for Booking Confirmation */}
        {confirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/40 pointer-events-auto">
            <div className="bg-white border-2 border-[#DFE7CA] rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center animate-fade-in">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#DCFCE7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l3 3 5-5" stroke="#22C55E" />
                </svg>
              </div>
              <div className="text-xl font-bold text-green-700 mb-2 text-center">Η κράτηση επιβεβαιώθηκε!</div>
              <div className="text-base text-black mb-2 text-center">Σας περιμένουμε!</div>
              <div className="text-sm text-gray-700 mb-4 text-center">Μπορείτε να κλείσετε την εφαρμογή.</div>
              <button
                className="mt-2 px-6 py-2 bg-[#DFE7CA] border border-[#B5C99A] rounded-xl text-black font-bold text-base transition"
                onClick={() => setConfirmationModal(false)}
              >Κλείσιμο</button>
            </div>
          </div>
        )}
        <footer className="mt-10 flex justify-center z-20 relative">
          <div className="w-full max-w-md bg-[#DFE7CA] rounded-2xl shadow-lg px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-[#B5C99A]">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full p-1 shadow-sm"><PhoneIcon className="h-4 w-4" style={{ color: '#B5C99A' }} /></span>
                <div>
                  <div className="text-xs font-semibold text-black">Τηλέφωνο</div>
                  <div className="text-sm text-black">2310 930 900</div>
                  <div className="text-sm text-black">6981 958 248</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full p-1 shadow-sm"><EnvelopeIcon className="h-4 w-4" style={{ color: '#B5C99A' }} /></span>
                <div>
                  <div className="text-xs font-semibold text-black">Email</div>
                  <div className="text-sm text-black">info@avgouste.gr</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 md:justify-end">
              <span className="bg-white rounded-full p-1 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#B5C99A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c1.656 0 3-1.344 3-3s-1.344-3-3-3-3 1.344-3 3 1.344 3 3 3zm0 2c-2.67 0-8 1.337-8 4v3h16v-3c0-2.663-5.33-4-8-4z" /></svg></span>
              <div>
                <div className="text-xs font-semibold text-black">Διεύθυνση</div>
                <div className="text-sm text-black">Εφέσου 20</div>
                <div className="text-sm text-black">Άνω Τούμπα, Θεσσαλονίκη</div>
              </div>
            </div>
          </div>
        </footer>
        {/* Add extra bottom margin so copyright does not overlap footer */}
        <div style={{ height: 48 }} />
      </main>
      {/* Copyright Notice - modern, beautiful, and with extra space */}
      <div style={{ position: 'fixed', left: 0, bottom: 0, width: '100%', zIndex: 100, background: '#DFE7CA', padding: '14px 0 10px 0', boxShadow: '0 -2px 12px rgba(0,0,0,0.07)', borderTopLeftRadius: 18, borderTopRightRadius: 18, fontFamily: 'var(--font-geist-sans, sans-serif)' }}>
        <span className="text-sm text-[#5B7553] text-center w-full block font-semibold tracking-wide">
          © Avgouste 2025 &nbsp;•&nbsp; Created with <span style={{ color: '#E57373', fontSize: '1.1em' }}>❤️</span> by
          <a href="https://konstantinoslepidas.vercel.app/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-700 transition font-bold ml-1">
            K.L.
          </a>
        </span>
      </div>
    </>
  );
}

export default function UserBookingPage() {
  return (
    <ClientWrapper>
      <UserBookingPageContent />
    </ClientWrapper>
  );
}

function Accordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 bg-[#DFE7CA] rounded-xl border border-[#B5C99A] text-black font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#B5C99A] transition"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="payment-details"
      >
        Πληροφορίες
        <svg className={`h-5 w-5 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div id="payment-details" className="mt-2 bg-[#DFE7CA] border border-[#B5C99A] rounded-xl px-4 py-3 text-black text-sm animate-fade-in">
          <div className="mb-2">
            <span className="font-bold text-black">Πληρωμή στο Ιατρείο</span>
            <ul className="list-disc ml-5 mt-1">
              <li>Πληρωμή με κάρτα</li>
              <li>Μετρητά</li>
            </ul>
          </div>
          <div className="mb-2">Κατά την επίσκεψη μπορείς να διαλέξεις τον τρόπο πληρωμής ανάμεσα από τις παραπάνω επιλογές.</div>
          <div className="mb-1"><span className="font-bold text-black">Ακύρωση</span></div>
          <div>Μπορείς να ακυρώσεις το ραντεβού σου μέχρι 5 ώρες πριν.</div>
        </div>
      )}
    </div>
  );
}