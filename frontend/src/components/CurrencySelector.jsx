import { useState, useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import axiosInstance from "../utils/axiosInstance";
import Loader from "./Loader";

const CurrencySelector = ({ t, onSelect, onClose }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSupportedCurrencies = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/payment/supported-currencies');
        if (response.data.success) {
          setCurrencies(response.data.currencies);
        } else {
          setError(response.data.error || 'Failed to load currencies');
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        setError('Error loading currencies, please try again');
      } finally {
        setLoading(false);
      }
    };

    fetchSupportedCurrencies();
  }, []);

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
  };

  const handleConfirm = () => {
    if (selectedCurrency) {
      onSelect(selectedCurrency);
    }
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
        
        <h2 className="text-xl font-bold mb-4 text-center">{t("chooseCurrency")}</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-6">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mt-4 max-h-[50vh] overflow-y-auto p-2">
              {currencies.map((currency) => (
                <div
                  key={currency.code}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCurrency?.code === currency.code 
                      ? 'bg-orange border-orange text-black' 
                      : 'border-gray-700 hover:border-orange/50'
                  }`}
                  onClick={() => handleCurrencySelect(currency)}
                >
                  <div className="font-bold">{currency.code}</div>
                  <div className="text-sm text-gray-300">{currency.name}</div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6 space-x-4">
              <button
                className="py-2 px-4 rounded-full border border-orange text-orange hover:bg-gray-800 transition-colors"
                onClick={onClose}
              >
                {t("cancelSelection")}
              </button>
              <button
                className={`py-2 px-8 rounded-full bg-orange text-black hover:opacity-90 transition-opacity ${
                  !selectedCurrency ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleConfirm}
                disabled={!selectedCurrency}
              >
                {t("confirmCurrency")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CurrencySelector; 