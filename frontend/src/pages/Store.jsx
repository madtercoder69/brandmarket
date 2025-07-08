import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import StoreSlider from "../components/StoreSlider";
import { setChat } from "../store/chatClice";
import { fetchStores } from "../store/storeSlice";
import { toast } from "react-sonner";
import { PaymentRecovery } from "../utils/paymentRecovery";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import BTCPayModal from "../components/BTCPayModal";


const Store = ({ t }) => {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [currentPaymentToken, setCurrentPaymentToken] = useState(null);
  const [isDevelopment] = useState(import.meta.env.MODE === 'development');
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchasedProductIds, setPurchasedProductIds] = useState([]);
  
  // BTCPay Modal states
  const [showBTCPayModal, setShowBTCPayModal] = useState(false);
  const [btcpayInvoiceData, setBTCPayInvoiceData] = useState(null);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    getStore();
    getPurchasedProducts();
    
    // Начало мониторинга активных платежей после загрузки страницы
    PaymentRecovery.startMonitoring((payment, result) => {
      console.log('Payment completed after page reload:', payment);
      toast.success(t("paymentSuccessful"));
      
      // Refresh purchased products list after successful payment
      getPurchasedProducts();
      
      // Открываем чат если платеж был выполнен
      if (payment.productId) {
        dispatch(setChat({ 
          productId: payment.productId, 
          type: "SUPPORT", 
          isOpen: true 
        }));
      }
    });
  }, []);

  const getStore = async () => {
    try {
      const response = await axiosInstance(`store/${id}`);
      setStore(response.data);
    } catch (err) {
      dispatch(fetchStores());
      navigate("/");
    }
  };

  const getPurchasedProducts = async () => {
    try {
      const response = await axiosInstance.get(`/payment/purchased-products?storeId=${id}`);
      if (response.data.success) {
        setPurchasedProductIds(response.data.purchasedProductIds);
      }
    } catch (error) {
      console.error('Error fetching purchased products:', error);
    }
  };

  const handleSelectPaymentMethod = async (product) => {
    // Check if product is already purchased before showing payment methods
    try {
      const response = await axiosInstance.post('/payment/check-product-availability', {
        productId: product.id
      });

      if (!response.data.available) {
        toast.error(t("productAlreadyPurchased") || "This product has already been purchased");
        return;
      }

    setSelectedProduct(product);
    setShowPaymentMethodSelector(true);
    } catch (error) {
      console.error('Error checking product availability:', error);
      toast.error(t("error"));
    }
  };

  const handlePaymentMethodSelected = async (paymentMethod) => {
    setShowPaymentMethodSelector(false);
    if (selectedProduct) {
      await handlePurchase(selectedProduct, paymentMethod);
    }
  };

  const handlePurchase = async (product, paymentMethod) => {
    try {
      setLoading(true);
      
      // Double-check availability before proceeding with payment
      const availabilityResponse = await axiosInstance.post('/payment/check-product-availability', {
        productId: product.id
      });

      if (!availabilityResponse.data.available) {
        toast.error(t("productAlreadyPurchased") || "This product has already been purchased");
        return;
      }
      
      console.log(`Creating payment for product: ${product.name}, price: ${product.price} KZT, method: ${paymentMethod.id}`);
      
      const currentLang = localStorage.getItem('i18nextLng') || 'ru';
      
      const response = await axiosInstance.post('/payment/create-invoice', {
        productId: product.id,
        lang: currentLang,
        paymentMethod: paymentMethod.id
      });
      
      if (response.data.success) {
        // Store payment data for recovery
        PaymentRecovery.storeActivePayment({
          productId: product.id,
          invoiceToken: response.data.invoiceToken,
          userId: user?.id,
          lang: currentLang,
          productName: product.name,
          amount: product.price
        });
        
        setCurrentPaymentToken(response.data.invoiceToken);
        
        // Check if payment method supports modal display (BTCPay Server)
        if (response.data.supportModal && response.data.invoiceId && response.data.btcpayServerUrl) {
          // Use BTCPay Server modal
          setBTCPayInvoiceData({
            invoiceId: response.data.invoiceId,
            btcpayServerUrl: response.data.btcpayServerUrl,
            productId: product.id,
            invoiceToken: response.data.invoiceToken
          });
          setShowBTCPayModal(true);
        } else {
          // Open payment page in a new window (traditional approach)
          window.open(response.data.invoiceUrl, '_blank');
        }
        
        // Open support chat
        dispatch(setChat({ productId: product.id, type: "SUPPORT", isOpen: true }));
        
        // Only start polling if not using BTCPay modal (modal handles events directly)
        if (!response.data.supportModal) {
          const checkPaymentStatus = async () => {
          try {
            const currentLang = localStorage.getItem('i18nextLng') || 'ru';
            
            const isDevelopment = import.meta.env.MODE === 'development';
            
            let statusUrl = `/payment/check-status?token=${response.data.invoiceToken}${user ? `&userId=${user.id}` : ''}&lang=${currentLang}`;
            
            if (isDevelopment) {
              console.log("Using test payment completion endpoint for development");
              statusUrl = `/payment/test-complete-payment?token=${response.data.invoiceToken}${user ? `&userId=${user.id}` : ''}&lang=${currentLang}`;
            }
            
            const statusResponse = await axiosInstance.get(statusUrl);
            
            if (statusResponse.data.status === 'COMPLETED') {
              toast.success(t("paymentSuccessful"));
              PaymentRecovery.removeActivePayment(product.id);
              clearInterval(statusCheckInterval);
              setCurrentPaymentToken(null);
              // Refresh purchased products list after successful payment
              getPurchasedProducts();
            } else if (statusResponse.data.error) {
              PaymentRecovery.removeActivePayment(product.id);
              clearInterval(statusCheckInterval);
              setCurrentPaymentToken(null);
            }
          } catch (error) {
            console.error("Error checking payment status:", error);
          }
        };
        
          const statusCheckInterval = setInterval(checkPaymentStatus, 15000);
          
          // Stop checking after 15 minutes (max invoice lifetime)
          setTimeout(() => clearInterval(statusCheckInterval), 15 * 60 * 1000);
        }
      } else {
        toast.error(response.data.error || t("errorCreatingInvoice"));
        dispatch(setChat({ productId: product.id, type: "SUPPORT", isOpen: true }));
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(t("paymentError"));
      dispatch(setChat({ productId: product.id, type: "SUPPORT", isOpen: true }));
    } finally {
      setLoading(false);
    }
  };

  const handleTestCompletePayment = async () => {
    if (!currentPaymentToken || !user) return;
    
    try {
      const currentLang = localStorage.getItem('i18nextLng') || 'ru';
      
      const statusResponse = await axiosInstance.get(
        `/payment/test-complete-payment?token=${currentPaymentToken}${user ? `&userId=${user.id}` : ''}&lang=${currentLang}`
      );
      
      if (statusResponse.data.status === 'COMPLETED') {
        toast.success(t("paymentSuccessful"));
        setCurrentPaymentToken(null);
        // Refresh purchased products list after successful payment
        getPurchasedProducts();
      } else if (statusResponse.data.error) {
        toast.error(statusResponse.data.error);
      }
    } catch (error) {
      console.error("Error testing payment completion:", error);
      toast.error(t("error"));
    }
  };

  // BTCPay Modal event handlers
  const handleBTCPayModalClose = () => {
    setShowBTCPayModal(false);
    setBTCPayInvoiceData(null);
    setCurrentPaymentToken(null);
    
    // Force a small delay to ensure BTCPay cleanup is complete
    setTimeout(() => {
      // Ensure page content is still visible after modal close
      const contentWrapper = document.querySelector('.content__wrapper');
      if (contentWrapper) {
        contentWrapper.style.display = 'block';
        contentWrapper.style.visibility = 'visible';
      }
    }, 100);
  };

  const handleBTCPayPaymentComplete = () => {
    toast.success(t("paymentSuccessful"));
    setShowBTCPayModal(false);
    setBTCPayInvoiceData(null);
    setCurrentPaymentToken(null);
    
    // Remove from payment recovery
    if (btcpayInvoiceData) {
      PaymentRecovery.removeActivePayment(btcpayInvoiceData.productId);
    }
    
    // Refresh purchased products list
    getPurchasedProducts();
  };

  const handleBTCPayPaymentExpired = () => {
    toast.error(t("paymentExpired") || "Payment expired");
    setShowBTCPayModal(false);
    setBTCPayInvoiceData(null);
    setCurrentPaymentToken(null);
    
    // Remove from payment recovery
    if (btcpayInvoiceData) {
      PaymentRecovery.removeActivePayment(btcpayInvoiceData.productId);
    }
  };

  // Filter out purchased products
  const availableProducts = store?.products?.filter(product => 
    !purchasedProductIds.includes(product.id)
  ) || [];

  return (
    <section className="content__wrapper" style={{ display: 'block', visibility: 'visible' }}>
      <div className="content">
        <div>
          <div className="text-center mb-12 flex flex-col gap-8">
            <h1 className="text-3xl">{store?.name}</h1>
            <p className="text-lg">{store?.description}</p>
          </div>

          <StoreSlider images={store?.carouselImages} />

          {store && (
            <div className="bg-[#1a1a1a8c] p-5 px-16 rounded-[20px] store__products__wrapper">
              <h2 className="text-xl text-center mb-4">{t("productsStore")}</h2>

              <ul className="flex flex-col gap-4">
                {availableProducts.length > 0 ? (
                  availableProducts.map((product) => {
                    return (
                      <li
                        className="w-full flex items-center gap-3 text-nowrap store__product__wrapper"
                        key={product.id}
                      >
                        <div className="bg-gray rounded-2xl py-4 px-8 grid grid-cols-5 w-full product__item">
                          <p className="truncate" title={product.name}>
                            {product.name}
                          </p>
                          <p
                            className="flex gap-2 truncate"
                            title={product.quantity + " " + product.type}
                          >
                            <span className="text-orange">
                              {product.quantity}
                            </span>
                            <span>{product.type}</span>
                          </p>
                          <p className="truncate" title={product.description}>
                            {product.description}
                          </p>
                          <p className="truncate" title={product.comment}>
                            {product.comment}
                          </p>
                          <p
                            className="truncate ml-auto text-orange price__product"
                            title={`${product.price} KZT`}
                          >
                            {product.price} KZT 
                          </p>
                        </div>

                        <button
                          className={`bg-orange py-2 px-8 rounded-full uppercase transition-opacity hover:opacity-[0.6] ${
                            loading ? "opacity-60 cursor-wait" : ""
                          }`}
                          onClick={() => handleSelectPaymentMethod(product)}
                          disabled={loading}
                        >
                          {loading ? t("processing") : t("purchase")}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <p className="text-center">
                    {store?.products?.length === 0 
                      ? t("productsExist")
                      : t("allProductsPurchased") || "All products have been purchased"
                    }
                  </p>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showPaymentMethodSelector && (
        <PaymentMethodSelector
          t={t}
          productPrice={selectedProduct?.price}
          onSelect={handlePaymentMethodSelected}
          onClose={() => setShowPaymentMethodSelector(false)}
        />
      )}
      
      {showBTCPayModal && btcpayInvoiceData && (
        <BTCPayModal
          isOpen={showBTCPayModal}
          onClose={handleBTCPayModalClose}
          invoiceId={btcpayInvoiceData.invoiceId}
          btcpayServerUrl={btcpayInvoiceData.btcpayServerUrl}
          onPaymentComplete={handleBTCPayPaymentComplete}
          onPaymentExpired={handleBTCPayPaymentExpired}
          t={t}
        />
      )}
    </section>
  );
};
export default Store;