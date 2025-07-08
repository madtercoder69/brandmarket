import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useDispatch } from "react-redux";
import { setChat } from "../store/chatClice";

const PaymentSuccess = ({ t }) => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    if (productId) {
      getProductDetails();
    }
  }, [productId]);

  const getProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/product/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    dispatch(setChat({ productId, type: "SUPPORT", isOpen: true }));
  };

  if (loading) {
    return (
      <section className="content__wrapper">
        <div className="content flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-2xl">{t("loading")}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="content__wrapper">
      <div className="content flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-darkness p-10 rounded-lg max-w-2xl w-full text-center">
          <div className="text-green-500 text-5xl mb-6">✓</div>
          <h1 className="text-3xl mb-4">{t("paymentSuccessful")}</h1>
          
          {product && (
            <div className="mb-6">
              <p className="mb-2">
                {t("productName")}: <span className="text-orange">{product.name}</span>
              </p>
              <p className="mb-2">
                {t("amount")}: <span className="text-orange">{product.price} KZT</span>
              </p>
            </div>
          )}
          
          <p className="text-gray-400 mb-8">{t("paymentSuccessDescription")}</p>
          
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <button
              onClick={handleContactSupport}
              className="bg-gray-700 hover:bg-gray-600 py-2 px-6 rounded-md transition-colors"
            >
              {t("contactSupport")}
            </button>
            
            <Link
              to="/"
              className="bg-orange hover:bg-orange/80 py-2 px-6 rounded-md transition-colors"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccess; 