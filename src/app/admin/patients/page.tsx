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
          // Deduplicate by telephone, only show first name for each phone
          const seen = new Set();
          const unique = [];
          for (const b of data) {
            if (b.telephone && !seen.has(b.telephone)) {
              seen.add(b.telephone);
              unique.push({ name: b.name, telephone: b.telephone, email: b.email });
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
    <main className="min-h-screen bg-gray-50 text-black p-8">
      <h1 className="text-3xl font-extrabold mb-6">Λίστα Ασθενών</h1>
      {loading ? (
        <div className="text-center text-black">Φόρτωση...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white">
          <table className="w-full text-base border-separate border-spacing-y-2">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="py-3 px-2 text-left font-bold">Όνομα</th>
                <th className="py-3 px-2 text-left font-bold">Τηλέφωνο</th>
                <th className="py-3 px-2 text-left font-bold">Email</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={p.telephone || i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-2">{p.name}</td>
                  <td className="py-2 px-2">{p.telephone}</td>
                  <td className="py-2 px-2">{p.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
} 