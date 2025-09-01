import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns3, Grid } from 'lucide-react';

export type Booking = {
  _id: string;
  name: string;
  service: string;
  date: string;
  time: string;
  telephone: string;
  email: string;
};

export type DayType = {
  day: string;
  classNames: string;
  uniqueKey: string;
  actualDate: string; // Store the actual date for this calendar day
  meetingInfo?: {
    date: string;
    time: string;
    title: string;
    participants: string[];
    location: string;
    booking: Booking;
    uniqueId: string;
  }[];
};

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: string | null) => void;
  onDateClick: (dateString: string) => void;
}

const Day: React.FC<DayProps> = ({ classNames, day, onHover, onDateClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <>
      <motion.div
        className={`relative flex items-center justify-center py-1 ${classNames}`}
        style={{ height: '4rem', borderRadius: 16 }}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover(day.day);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover(null);
        }}
        id={`day-${day.day}`}
      >
        <motion.div className="flex flex-col items-center justify-center">
          {!(day.day[0] === '+' || day.day[0] === '-') && (
            <span className="text-sm text-gray-800 font-semibold">{day.day}</span>
          )}
        </motion.div>
        {day.meetingInfo && (
          <motion.button
            className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-[#FBDAC6] p-1 text-[10px] font-bold text-gray-800 hover:bg-[#F9C4A3] transition-colors cursor-pointer"
            layoutId={`day-${day.day}-meeting-count`}
            style={{
              borderRadius: 999,
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Trigger filter for this specific date using the actual date
              onDateClick(day.actualDate);
            }}
            title={`Κράτησεις για ${day.day}`}
          >
            {day.meetingInfo.length}
          </motion.button>
        )}

        <AnimatePresence>
          {day.meetingInfo && isHovered && (
            <div className="absolute inset-0 flex size-full items-center justify-center">
              <motion.button
                className="flex size-10 items-center justify-center bg-[#FBDAC6] p-1 text-xs font-bold text-gray-800 hover:bg-[#F9C4A3] transition-colors cursor-pointer"
                layoutId={`day-${day.day}-meeting-count`}
                style={{
                  borderRadius: 999,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Trigger filter for this specific date using the actual date
                  onDateClick(day.actualDate);
                }}
                title={`Κράτησεις για ${day.day}`}
              >
                {day.meetingInfo.length}
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const CalendarGrid: React.FC<{ 
  onHover: (day: string | null) => void;
  onDateClick: (dateString: string) => void;
  days: DayType[];
}> = ({ onHover, onDateClick, days }) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => (
        <Day
          key={day.uniqueKey}
          classNames={day.classNames}
          day={day}
          onHover={onHover}
          onDateClick={onDateClick}
        />
      ))}
    </div>
  );
};

interface BookingCalendarProps {
  bookings: Booking[];
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (booking: Booking) => void;
  className?: string;
}

const BookingCalendar = React.forwardRef<
  HTMLDivElement,
  BookingCalendarProps
>(({ bookings, onEditBooking, onDeleteBooking, className, ...props }, ref) => {
  const [moreView, setMoreView] = useState(true); // Default to show bookings
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Use current date
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const handleDayHover = (day: string | null) => {
    setHoveredDay(day);
  };

  const handleDateClick = (dateString: string) => {
    setSelectedDate(selectedDate === dateString ? null : dateString);
  };

  // Convert bookings to calendar days
  const generateCalendarDays = (): DayType[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: DayType[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayNumber = currentDate.getDate();
      const isCurrentMonth = currentDate.getMonth() === month;
      // Use actual current date
      const today = new Date();
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Find bookings for this date using local date comparison
      const currentDateLocal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      // Ensure we get the correct date string without timezone issues
      const dateString = `${currentDateLocal.getFullYear()}-${String(currentDateLocal.getMonth() + 1).padStart(2, '0')}-${String(currentDateLocal.getDate()).padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => {
        // Handle potential timezone issues by using local date comparison
        const bookingDate = new Date(b.date);
        const bookingDateLocal = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
        return bookingDateLocal.getTime() === currentDateLocal.getTime();
      });
      
      // Sort bookings by time
      const sortedDayBookings = dayBookings.sort((a, b) => {
        // Extract time from booking.time (handle different formats)
        const timeA = a.time.split('-')[0].trim(); // Get first part if range like "11:00-12:00"
        const timeB = b.time.split('-')[0].trim();
        
        // Convert to minutes for comparison
        const getMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + (minutes || 0);
        };
        
        return getMinutes(timeA) - getMinutes(timeB);
      });

      const meetingInfo = sortedDayBookings.length > 0 ? sortedDayBookings.map((booking, bookingIndex) => ({
        date: new Date(booking.date).toLocaleDateString('el-GR', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: booking.time,
        title: booking.service,
        participants: [booking.name],
        location: booking.telephone || booking.email || 'Στο χώρο',
        booking: booking, // Pass the full booking object
        uniqueId: `${dateString}-${booking._id}-${bookingIndex}`, // Unique identifier for each booking
      })) : undefined;

      const classNames = isCurrentMonth 
        ? (isToday ? 'bg-[#FBDAC6] cursor-pointer' : 'bg-white cursor-pointer')
        : 'bg-gray-100';

      days.push({
        day: dayNumber.toString().padStart(2, '0'),
        classNames,
        meetingInfo,
        uniqueKey: `${dateString}-${i}`, // Unique key for each day
        actualDate: dateString, // Store the actual date for this calendar day
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const days = generateCalendarDays();
  
  const sortedDays = React.useMemo(() => {
    // Use actual current date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter out past dates (only show today and future)
    let filteredDays = days.filter(day => {
      return day.actualDate >= today;
    });
    
    // Apply selected date filter if clicked
    if (selectedDate) {
      filteredDays = filteredDays.filter(day => {
        return day.actualDate === selectedDate;
      });
    }
    
    // Sort by hovered day if hovering
    if (hoveredDay) {
      filteredDays = [...filteredDays].sort((a, b) => {
        if (a.day === hoveredDay) return -1;
        if (b.day === hoveredDay) return 1;
        return 0;
      });
    }
    
    return filteredDays;
  }, [hoveredDay, selectedDate, days]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    // Go to current month
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={ref}
        className={`relative mx-auto my-10 flex w-full flex-col items-center justify-center gap-8 lg:flex-row ${className}`}
        {...props}
      >
        <motion.div layout className="w-full max-w-lg">
          <motion.div
            key="calendar-view"
            className="flex w-full flex-col gap-4"
          >
                                    <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={goToPreviousMonth}
                              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                              title="Προηγούμενος μήνας"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-gray-800">
                              {monthName}
                            </motion.h2>
                            <button
                              onClick={goToNextMonth}
                              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                              title="Επόμενος μήνας"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={goToToday}
                            className="px-3 py-1 text-sm bg-[#FBDAC6] hover:bg-[#F9C4A3] rounded transition-colors"
                            title="Μετάβαση στη σημερινή ημερομηνία"
                          >
                            Σήμερα
                          </button>
              <motion.button
                className="relative flex items-center gap-3 rounded-lg border border-gray-300 px-1.5 py-1 text-gray-700"
                onClick={() => setMoreView(!moreView)}
              >
                <Columns3 className="z-[2]" />
                <Grid className="z-[2]" />
                <div
                  className="absolute left-0 top-0 h-[85%] w-7 rounded-md bg-[#FBDAC6] transition-transform duration-300"
                  style={{
                    top: '50%',
                    transform: moreView
                      ? 'translateY(-50%) translateX(40px)'
                      : 'translateY(-50%) translateX(4px)',
                  }}
                ></div>
              </motion.button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['ΚΥΡ', 'ΔΕΥ', 'ΤΡΙ', 'ΤΕΤ', 'ΠΕΜ', 'ΠΑΡ', 'ΣΑΒ'].map((day) => (
                <div
                  key={day}
                  className="px-0/5 rounded-xl bg-gray-200 py-1 text-center text-xs text-gray-700 font-bold"
                >
                  {day}
                </div>
              ))}
            </div>
            <CalendarGrid 
              onHover={handleDayHover} 
              onDateClick={handleDateClick}
              days={days}
            />
          </motion.div>
        </motion.div>
        {moreView && (
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              key="more-view"
              className="mt-4 flex w-full flex-col gap-4"
            >
                                        <div className="flex w-full flex-col items-start justify-between">
                            <div className="flex items-center justify-between w-full">
                              <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-gray-800">
                                {selectedDate ? `Κρατήσεις ${(() => {
                                  const [year, month, day] = selectedDate.split('-').map(Number);
                                  return new Date(year, month - 1, day).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
                                })()}` : 'Κρατήσεις'}
                              </motion.h2>
                              {selectedDate && (
                                <button
                                  onClick={() => setSelectedDate(null)}
                                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                                  title="Εμφάνιση όλων των κρατήσεων"
                                >
                                  Όλες
                                </button>
                              )}
                            </div>
                            <p className="font-medium text-gray-600">
                              {selectedDate 
                                ? `Κρατήσεις για την ημερομηνία ${(() => {
                                  const [year, month, day] = selectedDate.split('-').map(Number);
                                  return new Date(year, month - 1, day).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
                                })()}`
                                : 'Δείτε τις σημερινές και επερχόμενες κρατήσεις.'
                              }
                            </p>
                          </div>
              <motion.div
                className="flex h-[620px] flex-col items-start justify-start overflow-hidden overflow-y-scroll rounded-xl border-2 border-gray-200 shadow-md bg-white"
                layout
              >
                <AnimatePresence>
                  {sortedDays
                    .filter((day) => day.meetingInfo)
                    .map((day) => (
                      <motion.div
                        key={day.uniqueKey}
                        className={`w-full border-b-2 border-gray-200 py-0 last:border-b-0`}
                        layout
                      >
                        {day.meetingInfo &&
                          day.meetingInfo.map((meeting, mIndex) => (
                            <motion.div
                              key={meeting.uniqueId}
                              className="border-b border-gray-200 p-3 last:border-b-0"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{
                                duration: 0.2,
                                delay: mIndex * 0.05,
                              }}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  {meeting.date}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {meeting.time}
                                </span>
                              </div>
                              <h3 className="mb-1 text-xl font-bold text-gray-800">
                                {meeting.participants.join(', ')}
                              </h3>
                              <p className="mb-1 text-sm text-gray-600">
                                {meeting.title}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-blue-500">
                                  <svg
                                    className="mr-1 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="text-sm">
                                    {meeting.location}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onEditBooking && onEditBooking(meeting.booking)}
                                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Επεξεργασία"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => onDeleteBooking && onDeleteBooking(meeting.booking)}
                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                    title="Διαγραφή"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

BookingCalendar.displayName = 'BookingCalendar';

export default BookingCalendar; 