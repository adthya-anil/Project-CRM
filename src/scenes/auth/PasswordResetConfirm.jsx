// scenes/auth/PasswordResetConfirm.jsx

import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function PasswordResetConfirm() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Ready to reset password');
      }
    });
  }, []);

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus('✅ Password updated!');
      setTimeout(() => navigate('/'), 1500);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-20 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Set New Password</h2>
      <input
        className="w-full p-2 mb-4 border rounded"
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={handleReset}
      >
        Update Password
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
