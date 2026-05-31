import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionsService } from '../lib/questify/services/subscriptions.service';

export default function PaymentResult() {
  const [status, setStatus] = useState<string>('Verifying payment...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const activeSub = await SubscriptionsService.pollForActiveSubscription({
          timeoutMs: 5 * 60 * 1000, // 5 minutes
          intervalMs: 3000,
          onStatusCheck: (currStatus) => {
            if (currStatus) {
              setStatus(`Subscription status: ${currStatus}...`);
            }
          }
        });

        if (activeSub) {
          setStatus('Payment successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to verify payment. If you completed the payment, please check back later or contact support.');
      }
    };

    checkSubscription();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
