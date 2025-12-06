import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Background from '../components/layout/Background';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';

const CustomerWaitingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactionId, tn } = location.state || {};
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transactionId) {
      setError('No transaction ID found. Please try checking out again.');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await api(`/sales/public/transaction/${transactionId}`);
        
        // Check if response has data property (from the API wrapper)
        const responseData = response.data || response;
        
        if (responseData.status === 'completed') {
          setStatus('completed');
          clearInterval(interval);
          // Redirect to the receipt page with the transaction number
          navigate(`/receipt?tn=${responseData.tn || ''}&from=customer`);
        } else if (responseData.status) {
          // Update status if it exists in the response
          setStatus(responseData.status);
        }
      } catch (err) {
        console.error('Error fetching transaction status:', err);
        // More specific error message based on error response
        const errorMessage = err.response?.data?.error || 
                           'Could not fetch transaction status. Please check your connection.';
        setError(errorMessage);
        // Don't clear the interval on error, keep trying
        // clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [transactionId, navigate, tn]);

  return (
    <Background>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-blue-900 mb-4">
            Waiting for Cashier
          </h1>
          <p className="text-gray-600 mb-6">
            Please present your QR code to the cashier to complete your payment. This page will automatically update once your transaction is complete.
          </p>
          <Loader />
          <p className="text-sm text-gray-500 mt-4">
            Status: <span className="font-semibold">{status}</span>
          </p>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </Card>
      </div>
    </Background>
  );
};

export default CustomerWaitingPage;
