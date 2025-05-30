"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('adminSession', 'true');
      router.push('/admin/dashboard');
    } else {
      setError('Λάθος κωδικός.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xs">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Κωδικός"
            required
          />
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full bg-orange-300 hover:bg-orange-400 text-black font-bold py-2 px-4 rounded transition" style={{ background: '#FBDAC6' }}>
            Είσοδος
          </button>
        </form>
      </div>
    </main>
  );
} 