import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CiLogout } from "react-icons/ci";
import { logout } from "../store/userSlice";
import { TiArrowSortedUp } from "react-icons/ti";
import { useState, useEffect } from "react";
import logo from "/web-images/logo.svg";
import chatIcon from "/web-images/chat-modal-icon.svg";
import burgerIcon from "/web-images/burger-icon.svg";
import closeIcon from "/web-images/close-icon.svg";
import { setChat } from "../store/chatClice";
import axiosInstance from "../utils/axiosInstance";

const Header = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const location = useLocation();

  const [showNav, setShowNav] = useState(false);
  const [showLng, setShowLng] = useState(false);
  const [headerButtons, setHeaderButtons] = useState([]);

  const chat = useSelector((state) => state.chat.currentChat);

  useEffect(() => {
    const fetchHeaderButtons = async () => {
      try {
        const response = await axiosInstance.get('/header-buttons');
        setHeaderButtons(response.data);
      } catch (error) {
        console.error('Error fetching header buttons:', error);
      }
    };

    fetchHeaderButtons();
  }, []);

  const roleLabel = {
    SUPERADMIN: "/admin",
    ADMIN: "/admin",
    USER: "/account",
    STORE_OWNER: "/store-panel",
  };

  const toggleChat = () => {
    dispatch(setChat({ ...chat, isOpen: !chat.isOpen }));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const toggleLanguage = (lng) => {
    setShowLng(false);
    i18n.changeLanguage(lng);
  };

  if (
    location.pathname === "/store-panel" ||
    location.pathname === "/store-products" ||
    location.pathname === "/store-chats"
  )
    return null;

  return (
    <header className="bg-black">
      <div className="flex items-center w-full max-w-[1280px] mx-auto py-8 px-10 gap-16 header__wrapper">
        <img
          src={chatIcon}
          alt=""
          className="w-[25px] hidden chat__mobile__icon cursor-pointer"
          onClick={toggleChat}
        />
        <Link
          className="flex items-center gap-1 select-none cursor-pointer"
          to="/"
        >
          <img src={logo} alt="" className="w-[55px] pointer-events-none" />
          <p className="font-Sahar leading-[18px] text-xl">
            BRAND <br /> MARKET
          </p>
        </Link>
        <img
          src={showNav ? closeIcon : burgerIcon}
          alt=""
          className="w-[25px] hidden burger__icon cursor-pointer"
          onClick={() => setShowNav(!showNav)}
        />

        <div
          className={`flex items-center w-full gap-16 header__items ${
            showNav && "header__active"
          }`}
        >
          <Link
            to="/"
            className="bg-orange py-2 px-4 rounded-full select-none shop__link"
          >
            {t("stores")}
          </Link>

          <nav className="flex flex-1 justify-around link__icons">
            {headerButtons.map((button) => (
              <Link key={button.id} to={button.link}>
                <img src={button.icon} alt={button.name} className="w-[50px]" />
              </Link>
            ))}
          </nav>

          <div className="flex gap-16 user__btns">
            {user?.role !== "USER" && (
              <Link
                className="bg-orange py-2 px-4 rounded-full uppercase max-w-[84px] truncate"
                to={roleLabel[user?.role]}
              >
                {user?.username}
              </Link>
            )}
            <button
              className="bg-orange py-2 px-4 rounded-full"
              onClick={handleLogout}
            >
              <CiLogout className="text-2xl" />
            </button>
          </div>

          <div className="uppercase relative z-20 lng__btns">
            <p
              className="bg-gray py-2 px-4 rounded-full flex items-center gap-3 cursor-pointer"
              onClick={() => setShowLng(!showLng)}
            >
              {i18n.language} <TiArrowSortedUp className="text-xl" />
            </p>
            <div
              className={`bg-gray rounded-[20px] absolute left-0 top-[105%] w-full overflow-hidden transition-opacity ${
                showLng
                  ? "opacity-1 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <p
                onClick={() => toggleLanguage("ru")}
                className="cursor-pointer py-2 px-4 transition-colors hover:bg-darkness"
              >
                RU
              </p>
              <p
                onClick={() => toggleLanguage("kk")}
                className="cursor-pointer py-2 px-4 transition-colors hover:bg-darkness"
              >
                KK
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
