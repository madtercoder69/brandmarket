import { useState, useEffect } from 'react';
import { PaymentRecovery } from '../utils/paymentRecovery';

const ActivePaymentNotification = ({ t }) => {
  const [activePayments, setActivePayments] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check for active payments on component mount
    checkActivePayments();
    
    // Set up periodic check
    const interval = setInterval(checkActivePayments, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkActivePayments = () => {
    const payments = PaymentRecovery.getActivePayments();
    setActivePayments(payments);
    
    if (payments.length > 0 && !showNotification) {
      setShowNotification(true);
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowNotification(false), 10000);
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  const formatTimeRemaining = (expiresAt) => {
    const remaining = Math.max(0, expiresAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    return `${minutes}m`;
  };

  if (activePayments.length === 0 || !showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold">
          {t("activePaymentsTitle") || "Active Payments"}
        </h3>
        <button 
          onClick={dismissNotification}
          className="text-white hover:text-gray-200 ml-2"
        >
          ×
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        {activePayments.map((payment, index) => (
          <div key={index} className="bg-blue-700 p-2 rounded">
            <div className="font-medium">{payment.productName}</div>
            <div className="text-blue-200">
              {payment.amount} KZT • {formatTimeRemaining(payment.expiresAt)} {t("remaining") || "left"}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-blue-200">
        {t("paymentMonitoringMessage") || "We're monitoring your payments. You'll be notified when completed."}
      </div>
    </div>
  );
};

export default ActivePaymentNotification; 