/**
 * Payment Recovery Service
 * Handles payment state persistence across page reloads
 */

const STORAGE_KEY = 'activePayments';
const PAYMENT_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const PaymentRecovery = {
  /**
   * Store active payment in localStorage
   */
  storeActivePayment(paymentData) {
    try {
      const activePayments = this.getActivePayments();
      
      const payment = {
        ...paymentData,
        timestamp: Date.now(),
        expiresAt: Date.now() + PAYMENT_TIMEOUT
      };
      
      // Remove expired payments and existing payment for same product
      const filteredPayments = activePayments.filter(p => 
        p.expiresAt > Date.now() && p.productId !== payment.productId
      );
      
      filteredPayments.push(payment);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPayments));
      console.log('Stored active payment:', payment);
    } catch (error) {
      console.error('Error storing active payment:', error);
    }
  },

  /**
   * Get all active payments from localStorage
   */
  getActivePayments() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const payments = JSON.parse(stored);
      
      // Filter out expired payments
      const activePayments = payments.filter(p => p.expiresAt > Date.now());
      
      // Update storage if we removed expired payments
      if (activePayments.length !== payments.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activePayments));
      }
      
      return activePayments;
    } catch (error) {
      console.error('Error getting active payments:', error);
      return [];
    }
  },

  /**
   * Get specific active payment by product ID
   */
  getActivePayment(productId) {
    const activePayments = this.getActivePayments();
    return activePayments.find(p => p.productId === productId);
  },

  /**
   * Remove payment from storage (when completed or cancelled)
   */
  removeActivePayment(productId) {
    try {
      const activePayments = this.getActivePayments();
      const filteredPayments = activePayments.filter(p => p.productId !== productId);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPayments));
      console.log('Removed active payment for product:', productId);
    } catch (error) {
      console.error('Error removing active payment:', error);
    }
  },

  /**
   * Check payment status and handle completion
   */
  async checkPaymentStatus(paymentToken, userId, lang = 'ru') {
    try {
      const isDevelopment = import.meta.env.MODE === 'development';
      
      let statusUrl = `/payment/check-status?token=${paymentToken}${userId ? `&userId=${userId}` : ''}&lang=${lang}`;
      
      if (isDevelopment) {
        statusUrl = `/payment/test-complete-payment?token=${paymentToken}${userId ? `&userId=${userId}` : ''}&lang=${lang}`;
      }
      
      const axiosInstance = (await import('../utils/axiosInstance')).default;
      const statusResponse = await axiosInstance.get(statusUrl);
      
      return statusResponse.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { error: 'Failed to check payment status' };
    }
  },

  /**
   * Start monitoring active payments (call on app/page load)
   */
  async startMonitoring(onPaymentCompleted) {
    const activePayments = this.getActivePayments();
    
    if (activePayments.length === 0) {
      console.log('No active payments to monitor');
      return;
    }
    
    console.log(`Starting monitoring for ${activePayments.length} active payments`);
    
    for (const payment of activePayments) {
      this.monitorPayment(payment, onPaymentCompleted);
    }
  },

  /**
   * Monitor individual payment
   */
  async monitorPayment(payment, onPaymentCompleted) {
    console.log('Monitoring payment:', payment);
    
    const checkStatus = async () => {
      try {
        const result = await this.checkPaymentStatus(
          payment.invoiceToken, 
          payment.userId, 
          payment.lang
        );
        
        if (result.status === 'COMPLETED') {
          console.log('Payment completed during monitoring:', payment.productId);
          
          this.removeActivePayment(payment.productId);
          
          if (onPaymentCompleted) {
            onPaymentCompleted(payment, result);
          }
          
          return true;
        } else if (result.error) {
          console.log('Payment monitoring error:', result.error);
          this.removeActivePayment(payment.productId);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error in payment monitoring:', error);
        return false;
      }
    };
    
    const completed = await checkStatus();
    if (completed) return;
    
    const interval = setInterval(async () => {
      const completed = await checkStatus();
      if (completed) {
        clearInterval(interval);
      }
    }, 15000);
    
    setTimeout(() => {
      clearInterval(interval);
      this.removeActivePayment(payment.productId);
      console.log('Payment monitoring timeout for:', payment.productId);
    }, PAYMENT_TIMEOUT);
  },

  /**
   * Clear all stored payments (for cleanup)
   */
  clearAllPayments() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared all stored payments');
  }
}; 