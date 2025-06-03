"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<{ name: string; telephone: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('adminSession') !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/bookings-list');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Deduplicate only by name (show only first occurrence of each name)
          const seenNames = new Set();
          const unique = [];
          for (const b of data) {
            const name = b.name || '-';
            if (name && !seenNames.has(name)) {
              seenNames.add(name);
              unique.push({ name, telephone: b.telephone || '-', email: b.email || '-' });
            }
          }
          setPatients(unique);
        } else {
          setError(data.error || 'Σφάλμα φόρτωσης ασθενών.');
        }
      } catch {
        setError('Σφάλμα φόρτωσης ασθενών.');
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-[#DFE7CA] text-black pb-12">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur flex items-center justify-between px-6 py-4 shadow-sm rounded-b-2xl mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Λίστα Ασθενών</h1>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="bg-[#B5C99A] hover:bg-[#5B7553] text-white font-bold px-5 py-2 rounded-lg transition text-base shadow"
        >
          Επιστροφή στο Dashboard
        </button>
      </nav>
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center text-black text-lg font-semibold py-12">Φόρτωση...</div>
        ) : error ? (
          <div className="text-center text-red-600 text-lg font-semibold py-12">{error}</div>
        ) : (
          <div className="rounded-2xl shadow-xl border border-[#B5C99A] bg-white overflow-hidden">
            <table className="w-full text-base border-separate border-spacing-y-2">
              <thead className="sticky top-0 bg-[#DFE7CA] z-10">
                <tr>
                  <th className="py-3 px-2 text-left font-bold text-[#5B7553]">Όνομα</th>
                  <th className="py-3 px-2 text-left font-bold text-[#5B7553]">Τηλέφωνο</th>
                  <th className="py-3 px-2 text-left font-bold text-[#5B7553]">Email</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr
                    key={p.telephone + p.email + i}
                    className={
                      'transition hover:bg-[#FBDAC6]/60 ' +
                      (i % 2 === 0 ? 'bg-[#F8F9F4]' : 'bg-white')
                    }
                  >
                    <td className="py-2 px-2 font-semibold text-black">{p.name}</td>
                    <td className="py-2 px-2 text-black">{p.telephone}</td>
                    <td className="py-2 px-2 text-black">{p.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 