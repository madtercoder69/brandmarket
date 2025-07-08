import { Link } from "react-router-dom";
import logo from "/web-images/logo.svg";
import settingIco from "/web-images/settings-icon.svg";

const StoreHeader = ({ t }) => {
  return (
    <header className="relative w-full flex items-center justify-center mb-14 store__header__wrapper">
      <div className="flex items-center gap-1 select-none cursor-pointer">
        <img src={logo} alt="" className="w-[55px] pointer-events-none" />
        <p className="font-Sahar leading-[18px] text-xl">
          BRAND <br /> MARKET
        </p>
      </div>
      <ul className="absolute right-0 flex gap-4 items-center px-4 store__header">
        <Link className="bg-orange px-4 py-2 rounded-[7px]" to="/">
          {t("main")}
        </Link>
        <Link
          className="bg-orange px-4 py-2 rounded-[7px]"
          to="/store-products"
        >
          {t("products")}
        </Link>
        <Link className="bg-orange px-4 py-2 rounded-[7px]" to="/store-chats">
          {t("chats")}
        </Link>
        <Link className="bg-orange px-4 py-2 rounded-[7px]" to="/store-panel">
          {t("shop")}
        </Link>
        <div>
          <img src={settingIco} alt="" className="w-[30px]" />
        </div>
      </ul>
    </header>
  );
};
export default StoreHeader;
