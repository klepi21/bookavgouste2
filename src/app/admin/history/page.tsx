"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar1 } from '@/components/ui/navbar-1';

type Booking = {
  _id: string;
  name: string;
  service: string;
  date: string;
  time: string;
  telephone: string;
  email: string;
};

export default function AdminHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [dateMode, setDateMode] = useState<'range' | 'single'>('range');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('adminSession') !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  const fetchBookings = async () => {
    if (!startDate && !singleDate) {
      setError('Please select a date or date range');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let url = '/api/bookings-list';
      const params = new URLSearchParams();
      
      if (dateMode === 'single' && singleDate) {
        params.append('startDate', singleDate);
        params.append('endDate', singleDate);
      } else if (dateMode === 'range' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        // Filter bookings by date range if needed
        let filteredBookings = data;
        
        if (dateMode === 'single' && singleDate) {
          filteredBookings = data.filter((booking: Booking) => booking.date === singleDate);
        } else if (dateMode === 'range' && startDate && endDate) {
          filteredBookings = data.filter((booking: Booking) => {
            const bookingDate = new Date(booking.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return bookingDate >= start && bookingDate <= end;
          });
        }
        
        setBookings(filteredBookings);
      } else {
        setError(data.error || 'Error fetching bookings');
      }
    } catch (err) {
      setError('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setBookings([]);
    setError('');
  };

  const exportToCSV = () => {
    if (bookings.length === 0) return;
    
    const headers = ['Date', 'Time', 'Name', 'Service', 'Email', 'Telephone'];
    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => [
        booking.date,
        booking.time,
        `"${booking.name}"`,
        `"${booking.service}"`,
        `"${booking.email}"`,
        `"${booking.telephone}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${dateMode === 'single' ? singleDate : `${startDate}_to_${endDate}`}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    // Handle time ranges like "09:00 - 09:45"
    if (timeStr.includes('-')) {
      return timeStr;
    }
    return timeStr;
  };

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      <Navbar1 
        onLogout={() => {
          localStorage.removeItem('adminSession');
          router.push('/admin/login');
        }} 
        onNewBooking={() => {}} 
        activeTab="history"
        onTabChange={() => {}}
      />
      
      <section className="w-full py-8 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Booking History</h1>
          
          {/* Date Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Date Range</h2>
            
            {/* Date Mode Toggle */}
            <div className="mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setDateMode('range')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    dateMode === 'range'
                      ? 'bg-orange-200 text-black border-2 border-orange-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Date Range
                </button>
                <button
                  onClick={() => setDateMode('single')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    dateMode === 'single'
                      ? 'bg-orange-200 text-black border-2 border-orange-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Date
                </button>
              </div>
            </div>
            
            {/* Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {dateMode === 'range' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                  />
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={fetchBookings}
                disabled={loading}
                className="bg-orange-200 hover:bg-orange-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Search Bookings'}
              </button>
              
              <button
                onClick={clearResults}
                className="bg-gray-200 hover:bg-gray-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
              >
                Clear Results
              </button>
              
              {bookings.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="bg-green-200 hover:bg-green-300 text-black font-bold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
          
          {/* Results */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Found {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(booking.time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={booking.service}>
                            {booking.service}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            {booking.email && (
                              <div className="text-blue-600">{booking.email}</div>
                            )}
                            {booking.telephone && (
                              <div className="text-gray-600">{booking.telephone}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* No Results */}
          {bookings.length === 0 && !loading && !error && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">No bookings found</p>
                <p className="text-gray-500">Select a date or date range to search for bookings.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
