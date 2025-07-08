import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { fetchUser } from "../store/userSlice";
import { toast } from "react-sonner";
import axiosInstance from "../utils/axiosInstance";
import logo from "/web-images/logo-st.svg";

const SignUp = ({ t }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
  const status = useSelector((state) => state.user.status);

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/auth/register", {
        username,
        password,
      });
      window.localStorage.setItem("accessToken", response.data.accessToken);
      window.localStorage.setItem("refreshToken", response.data.refreshToken);
      toast.success("Успешная регистрация!");
      dispatch(fetchUser());
      navigate("/");
    } catch (err) {
      console.log(err);
      if (err.status === 401) return toast.error("");
      toast.error("Ошибка");
    }
  };

  useEffect(() => {
    document.body.setAttribute('data-page', 'signup');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (status === "loading") {
    return null;
  }

  return (
    <section className="content__wrapper content__wrapper flex items-center justify-center auth__wrapper flex-col gap-0 md:gap-[30px]">
      {/* Mobile spacer to avoid background logo overlap */}
      <div className="block md:hidden w-[200px] h-[200px]"></div>
      
      {/* Logo only on desktop - on mobile it's in background */}
      <img
        src={logo}
        alt=""
        className="pointer-events-none w-[200px] logo__auth hidden md:block"
      />

      {/* Registration Rules */}
      <div className="max-w-[500px] w-full bg-gray p-6 rounded-3xl">
        <h3 className="text-lg font-semibold mb-4 text-center">
          {t("registrationRules")}
        </h3>
        <div className="space-y-2 text-sm">
          <p>{t("registrationRule1")}</p>
          <p>{t("registrationRule2")}</p>
          <p>{t("registrationRule3")}</p>
          <p className="font-medium text-red-400 mt-3">
            {t("registrationWarning")}
          </p>
        </div>
      </div>

      <form
        className="max-w-[500px] w-full flex flex-col gap-5 auth__cc"
        onSubmit={handleFormSubmit}
      >
        <Input
          text={t("login")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          text={t("password")}
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex flex-col items-center gap-2">
          <Button className="w-full" type="submit">
            {t("signup")}
          </Button>
          <Link
            className="bg-gray py-4 px-5 rounded-3xl transition-opacity hover:opacity-[0.8] w-full text-center"
            to="/sign-in"
          >
            {t("signin")}
          </Link>
        </div>
      </form>
    </section>
  );
};
export default SignUp;
