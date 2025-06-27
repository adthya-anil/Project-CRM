import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSendReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://localhost:5173/reset-password-confirm',
    });

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus('✅ Reset link sent! Check your email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0a3456] mb-2">SafetyCatch</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-[#0a3456] to-[#3196c9] mx-auto rounded-full"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0a3456] to-[#3196c9] px-8 py-6">
            <h2 className="text-2xl font-semibold text-white text-center">
              Forgot Password?
            </h2>
            <p className="text-blue-100 text-center mt-2 text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3196c9] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                className="w-full bg-gradient-to-r from-[#0a3456] to-[#3196c9] text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                onClick={handleSendReset}
                disabled={!email.trim()}
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Reset Link
                </span>
              </button>

              {/* Status Message */}
              {status && (
                <div className={`p-4 rounded-lg border ${
                  status.includes('❌') 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {status.includes('❌') ? '❌' : '✅'}
                    </span>
                    <span className="font-medium">
                      {status.replace('❌ ', '').replace('✅ ', '')}
                    </span>
                  </div>
                </div>
              )}

              {/* Back to Login */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <a href="/login" className="text-[#3196c9] hover:text-[#0a3456] font-medium transition-colors">
                    Back to Login
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 SafetyCatch. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}