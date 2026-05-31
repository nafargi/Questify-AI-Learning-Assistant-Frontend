import React, { useEffect, useState } from 'react';
import { SubscriptionsService } from '../lib/questify/services/subscriptions.service';
import { UsagePlan } from '../lib/questify/types/subscription.types';
import { AuthService } from '../lib/questify/services/auth.service';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const [plans, setPlans] = useState<UsagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        // Check if user is logged in
        try {
          await AuthService.getProfile();
          setIsLoggedIn(true);
        } catch {
          setIsLoggedIn(false);
        }
        
        const fetchedPlans = await SubscriptionsService.getPlans();
        setPlans(fetchedPlans);
      } catch (err: any) {
        setError(err.message || 'Failed to load pricing plans');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!isLoggedIn) {
      // Redirect to login or show modal
      navigate('/login?redirect=/pricing');
      return;
    }
    
    try {
      setLoading(true);
      const { pay_url } = await SubscriptionsService.initiatePayment(planId);
      // Redirect to Chapa payment page
      window.location.href = pay_url;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Choose the plan that best fits your learning needs. Upgrade anytime.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 text-center max-w-3xl mx-auto">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col p-8 transition-transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="mb-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
              <span className="text-gray-500 ml-2">{plan.currency} / {plan.duration_days} days</span>
            </div>
            
            {plan.description && (
              <p className="text-gray-600 mb-6">{plan.description}</p>
            )}

            <ul className="flex-1 space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span className="text-gray-600">{plan.features.material_limit} Materials Limit</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span className="text-gray-600">Max {plan.features.file_size_limit_mb}MB per file</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span className="text-gray-600">{plan.features.ai_requests_per_day} AI Requests / day</span>
              </li>
              
              {plan.features.exam_generation_enabled && (
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-gray-600">Exam Generation Enabled</span>
                </li>
              )}
              
              {plan.features.chat_enabled && (
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-gray-600">AI Chat Support</span>
                </li>
              )}
            </ul>

            <button 
              onClick={() => handleSubscribe(plan.plan_id || plan.id)}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-200 disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isLoggedIn ? 'Get Started' : 'Login to Subscribe')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
