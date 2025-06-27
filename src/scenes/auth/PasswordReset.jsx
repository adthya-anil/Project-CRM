// scenes/auth/PasswordReset.jsx

import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSendReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://crm.safetycatch.in/reset-password-confirm',
    });

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus('✅ Reset link sent! Check your email.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-20 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Forgot Password?</h2>
      <input
        className="w-full p-2 mb-4 border rounded"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleSendReset}
      >
        Send Reset Link
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
