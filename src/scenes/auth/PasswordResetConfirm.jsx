import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function PasswordResetConfirm() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session && session.user) {
        console.log('✅ Session ready:', session);
        setSessionReady(true);
      } else {
        console.warn('❌ Session not found or expired.', error);
        setStatus('❌ Link expired or session not found. Try again.');
      }
    };

    checkSession();
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

      {!sessionReady ? (
        <p className="text-red-600">{status || 'Checking session...'}</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
