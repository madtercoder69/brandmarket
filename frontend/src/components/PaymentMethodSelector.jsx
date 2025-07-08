import { useState, useEffect } from "react";
import { IoCloseSharp, IoWallet, IoLogoAndroid } from "react-icons/io5";
import { FaBitcoin } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import Loader from "./Loader";

const PaymentMethodSelector = ({ t, onSelect, onClose, productPrice }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/payment/payment-methods');
        if (response.data.success) {
          setPaymentMethods(response.data.methods);
        } else {
          setError(response.data.error || 'Failed to load payment methods');
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setError('Error loading payment methods, please try again');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    }
  };

  const getMethodIcon = (iconName) => {
    switch (iconName) {
      case 'wallet':
        return <IoWallet size={24} />;
      case 'bot':
        return <IoLogoAndroid size={24} />;
      case 'bitcoin':
        return <FaBitcoin size={24} />;
      default:
        return <IoWallet size={24} />;
    }
  };

  const formatMinAmount = (method) => {
    // Use the pre-calculated minAmountDisplay from backend with real exchange rates
    if (method.minAmountDisplay) {
      return method.minAmountDisplay;
    }
    
    // Fallback for methods without minAmountDisplay
    if (method.id === 'westwallet') {
      return `${method.minAmount} USDT (≈${method.minAmountKZT || 4500} KZT)`;
    }
    return `$${method.minAmount}`;
  };

  const isMethodAvailable = (method) => {
    if (method.id === 'westwallet') {
      // Use the real minimum amount in KZT calculated by backend
      const minAmountKZT = method.minAmountKZT || 4500; // Fallback to 4500 if not provided
      return productPrice >= minAmountKZT;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-darkness rounded-xl p-6 max-w-md w-full relative">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <IoCloseSharp size={24} />
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-center">{t("choosePaymentMethod")}</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-6">{error}</div>
        ) : (
          <>
            <div className="space-y-3 mt-4">
              {paymentMethods.map((method) => {
                const available = isMethodAvailable(method);
                return (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !available 
                        ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                        : selectedMethod?.id === method.id 
                          ? 'bg-orange border-orange text-black' 
                          : 'border-gray-700 hover:border-orange/50'
                    }`}
                    onClick={() => available && handleMethodSelect(method)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${selectedMethod?.id === method.id ? 'text-black' : 'text-orange'}`}>
                        {getMethodIcon(method.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{method.name}</div>
                        <div className={`text-sm ${selectedMethod?.id === method.id ? 'text-gray-700' : 'text-gray-300'}`}>
                          {method.description}
                        </div>
                        <div className={`text-xs ${selectedMethod?.id === method.id ? 'text-gray-600' : 'text-gray-400'}`}>
                          {t("minimum")}: {formatMinAmount(method)}
                        </div>
                        {!available && (
                          <div className="text-red-400 text-xs mt-1">
                            {t("minimumAmountNotMet")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-6 space-x-4">
              <button
                className="py-2 px-4 rounded-full border border-orange text-orange hover:bg-gray-800 transition-colors"
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button
                className={`py-2 px-8 rounded-full bg-orange text-black hover:opacity-90 transition-opacity ${
                  !selectedMethod ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleConfirm}
                disabled={!selectedMethod}
              >
                {t("continue")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector; 