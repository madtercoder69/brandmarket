import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "../store/userSlice";
import logo from "/web-images/logo-st.svg";

const SignIn = ({ t }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
  const status = useSelector((state) => state.user.status);

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      });
      window.localStorage.setItem("accessToken", response.data.accessToken);
      window.localStorage.setItem("refreshToken", response.data.refreshToken);
      toast.success("Успешная авторизация!");
      dispatch(fetchUser());
      navigate("/");
    } catch (err) {
      if (err.status === 403)
        return toast.warning(err?.response?.data?.message);

      if (err.status === 401) return toast.error("Invalid credentials");
      toast.error(t("error"));
    }
  };

  useEffect(() => {
    document.body.setAttribute('data-page', 'signin');
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
    <section className="content__wrapper flex items-center justify-center auth__wrapper flex-col gap-[100px]">
      <img
        src={logo}
        alt=""
        className="pointer-events-none w-[200px] logo__auth"
      />

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
            {t("signin")}
          </Button>
          <Link
            className="bg-gray py-4 px-5 rounded-3xl transition-opacity hover:opacity-[0.8] w-full text-center"
            to="/sign-up"
          >
            {t("signup")}
          </Link>
        </div>
      </form>
    </section>
  );
};
export default SignIn;
