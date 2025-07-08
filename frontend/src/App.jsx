import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { fetchUser, logout } from "./store/userSlice";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { Toaster } from "react-sonner";
import Header from "./components/Header";
import { fetchStores } from "./store/storeSlice";
import { fetchOverview } from "./store/overviewSlice";
import { fetchCategories } from "./store/categorySlice";
import AdminPanel from "./pages/AdminPanel";
import Store from "./pages/Store";
import StorePanel from "./pages/StorePanel";
import StoreProducts from "./pages/StoreProducts";
import StoreChats from "./pages/StoreChats";
import ClientChat from "./components/ClientChat";
import Casino from "./pages/Casino";
import Bs from "./pages/Bs";
import Chat from "./pages/Chat";
import PaymentSuccess from "./pages/PaymentSuccess";
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.user);
  const status = useSelector((state) => state.user.status);

  useEffect(() => {
    if (!user && status === "idle") {
      dispatch(fetchUser());
    }
  }, [dispatch, user, status]);

  useEffect(() => {
    if (!user) return;

    if (user.isBlocked) {
      dispatch(logout());
      return;
    }

    dispatch(fetchCategories());
    dispatch(fetchStores());
    dispatch(fetchOverview());
  }, [dispatch, user]);

  useEffect(() => {
    if (
      status === "failed" ||
      (status === "succeeded" && !user && location.pathname !== "/sign-up")
    ) {
      navigate("/sign-in");
    }
  }, [status, user, navigate, location.pathname]);

  if (status === "loading") return null;

  return (
    <main className="flex flex-col min-h-screen h-full w-full">
      {user && <Header />}
      <Toaster />
      {user && <ClientChat t={t} />}
      <Routes>
        <Route path="/" element={user ? <Home t={t} /> : <SignIn t={t} />} />
        <Route
          path="/store/:id"
          element={
            user ? (
              <Store t={t} />
            ) : status === "loading" ? null : status === "succeeded" &&
              !user ? (
              <SignIn t={t} />
            ) : null
          }
        />

        <Route path="/admin" element={<AdminPanel t={t} />} />

        <Route path="/store-panel" element={<StorePanel t={t} />} />
        <Route path="/store-products" element={<StoreProducts t={t} />} />
        <Route path="/store-chats" element={<StoreChats t={t} />} />
        
        <Route path="/payment/success" element={<PaymentSuccess t={t} />} />

        <Route path="/casino" element={<Casino t={t} />} />
        <Route path="/bs" element={<Bs />} t={t} />
        <Route path="/chat" element={<Chat t={t} />} />

        <Route path="/sign-in" element={<SignIn t={t} />} />
        <Route path="/sign-up" element={<SignUp t={t} />} />
      </Routes>
    </main>
  );
}

export default App;
