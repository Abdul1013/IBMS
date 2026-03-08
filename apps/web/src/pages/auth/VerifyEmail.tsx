import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/axios';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 text-center">
        {status === 'loading' && <p className="text-gray-500">Verifying your email...</p>}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your account is active. You can now sign in.
            </p>
            <Link
              to="/login"
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-sm"
            >
              Go to sign in
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verification failed</h2>
            <p className="text-gray-500 text-sm mb-6">
              This link is invalid or has expired. Request a new one.
            </p>
            <Link to="/login" className="text-primary font-medium hover:underline text-sm">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
