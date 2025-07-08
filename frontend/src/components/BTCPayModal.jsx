import { useEffect, useRef, useState } from 'react';
import { IoCloseSharp } from "react-icons/io5";

const BTCPayModal = ({ 
  isOpen, 
  onClose, 
  invoiceId, 
  btcpayServerUrl, 
  onPaymentComplete, 
  onPaymentExpired,
  t 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scriptLoaded = useRef(false);
  const btcpayScriptUrl = `${btcpayServerUrl}/modal/btcpay.js`;

  useEffect(() => {
    if (!isOpen || !invoiceId || !btcpayServerUrl) {
      // Reset states when modal closes
      if (!isOpen) {
        setIsLoading(true);
        setError(null);
        scriptLoaded.current = false;
      }
      return;
    }

    const loadBTCPayScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (window.btcpay && scriptLoaded.current) {
          resolve();
          return;
        }

        // Remove existing script if any
        const existingScript = document.querySelector(`script[src="${btcpayScriptUrl}"]`);
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = btcpayScriptUrl;
        script.async = true;
        
        script.onload = () => {
          console.log('BTCPay script loaded successfully');
          scriptLoaded.current = true;
          resolve();
        };
        
        script.onerror = () => {
          console.error('Failed to load BTCPay script');
          reject(new Error('Failed to load BTCPay script'));
        };
        
        document.head.appendChild(script);
      });
    };

    const initBTCPayModal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadBTCPayScript();

        // Wait a bit for btcpay object to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!window.btcpay) {
          throw new Error('BTCPay object not available');
        }

        // Set up event listeners
        window.btcpay.onModalWillEnter(() => {
          console.log('BTCPay modal will enter');
          setIsLoading(false);
        });

        window.btcpay.onModalWillLeave(() => {
          console.log('BTCPay modal will leave');
        });

        window.btcpay.onModalReceiveMessage((event) => {
          console.log('BTCPay modal message:', event.data);
          
          if (typeof event.data === 'object' && event.data.status) {
            switch (event.data.status) {
              case 'complete':
              case 'paid':
                console.log('Payment completed');
                if (onPaymentComplete) {
                  onPaymentComplete();
                }
                break;
              case 'expired':
                console.log('Payment expired');
                if (onPaymentExpired) {
                  onPaymentExpired();
                }
                break;
            }
          } else if (event.data === 'close') {
            console.log('User closed BTCPay modal');
            onClose();
          }
        });

        // Show the invoice
        console.log('Showing BTCPay invoice:', invoiceId);
        window.btcpay.showInvoice(invoiceId);

      } catch (error) {
        console.error('Error initializing BTCPay modal:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initBTCPayModal();

    // Cleanup function
    return () => {
      try {
        if (window.btcpay) {
          if (window.btcpay.hideFrame) {
            window.btcpay.hideFrame();
          }
          // Clear any BTCPay DOM elements that might interfere
          const btcpayElements = document.querySelectorAll('[id*="btcpay"], [class*="btcpay"]');
          btcpayElements.forEach(el => {
            if (el && el.parentNode && !el.closest('.btcpay-modal-container')) {
              el.remove();
            }
          });
        }
      } catch (error) {
        console.log('BTCPay cleanup error (non-critical):', error);
      }
    };
  }, [isOpen, invoiceId, btcpayServerUrl, onPaymentComplete, onPaymentExpired, onClose]);

  const handleClose = () => {
    try {
      if (window.btcpay && window.btcpay.hideFrame) {
        window.btcpay.hideFrame();
      }
      // Clean up any BTCPay elements that might affect the page
      setTimeout(() => {
        const btcpayElements = document.querySelectorAll('[id*="btcpay"], [class*="btcpay"]');
        btcpayElements.forEach(el => {
          if (el && el.parentNode && !el.closest('.btcpay-modal-container')) {
            el.remove();
          }
        });
      }, 100);
    } catch (error) {
      console.log('BTCPay close cleanup error (non-critical):', error);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-darkness rounded-xl p-6 max-w-4xl w-full mx-4 relative min-h-[600px]">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          onClick={handleClose}
        >
          <IoCloseSharp size={24} />
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-center">
          {t("btcpayPayment") || "BTCPay Server Payment"}
        </h2>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange"></div>
            <p className="mt-4 text-gray-300">
              {t("loadingPayment") || "Loading payment interface..."}
            </p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 text-center">
              <p className="text-lg font-semibold mb-2">
                {t("paymentLoadError") || "Error loading payment"}
              </p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              className="mt-4 py-2 px-4 rounded-full bg-orange text-black hover:opacity-90 transition-opacity"
              onClick={onClose}
            >
              {t("close") || "Close"}
            </button>
          </div>
        )}
        
        {/* BTCPay modal will be injected here by the script */}
        <div id="btcpay-modal-container" className="btcpay-modal-container w-full"></div>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>{t("btcpayInfo") || "Powered by BTCPay Server - Accept Bitcoin & cryptocurrencies"}</p>
        </div>
      </div>
    </div>
  );
};

export default BTCPayModal; 