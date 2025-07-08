import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import StoreHeader from "../components/StoreHeader";
import { toast } from "react-sonner";
import axiosInstance from "../utils/axiosInstance";
import bootImage from "/web-images/shop-boot.jpg";
import logo from "/web-images/logo.svg";
import { fetchStores } from "../store/storeSlice";
import { fetchLabeled } from "../store/labeledSlice";
import { IoIosArrowForward } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";

const StorePanel = ({ t }) => {
  const URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [store, setStore] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLabeled, setSelectedLabeled] = useState([]);

  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [openCategories, setOpenCategories] = useState({});

  const categories = useSelector((state) => state.categories.categories);
  const labeled = useSelector((state) => state.labeled.labeled);
  const user = useSelector((state) => state.user.user);
  const status = useSelector((state) => state.user.status);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmitImage = async () => {
    if (!selectedImage) {
      return toast.warning(t("selectImage"));
    }

    const formData = new FormData();
    formData.append("mainImage", selectedImage);

    try {
      await axiosInstance.patch(`/store/${store.id}/main-image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      getStore();
      dispatch(fetchStores());
      toast.success(t("imageUpdated"));
    } catch (error) {
      toast.error(t("errorUploadImage"));
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim()) return;

    try {
      await axiosInstance.patch(`/store/${store.id}`, { name });
      toast.success(t("storeNameUpdated"));
      setName("");
      getStore();
      dispatch(fetchStores());
    } catch (error) {
      toast.error(t("errorUpdatedStoreName"));
    }
  };

  const getStore = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance(`/store/owner/${user.id}`);
      setStore(response.data[0]);
    } catch (error) {
      toast.error(t("errorOnGetStore"));
    }
  }, [user]);

  const onSubmitLabeled = async () => {
    try {
      await axiosInstance.post(`store/${store.id}/filters`, {
        filterIds: selectedLabeled,
      });
      toast.success(t("success"));
      getStore();
      dispatch(fetchStores());
    } catch (err) {
      toast.error(t("error"));
      console.log(err);
    }
  };

  const handleRemoveLabeled = async (id) => {
    try {
      await axiosInstance.delete(`store/${store.id}/filter/${id}`);
      toast.success("Успешно");
      dispatch(fetchStores());
      getStore();
    } catch (err) {
      console.log(err);
    }
  };

  const toggleLabeled = (labeldId) => {
    setSelectedLabeled((prev) =>
      prev.includes(labeldId)
        ? prev.filter((id) => id !== labeldId)
        : [...prev, labeldId]
    );
  };

  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      return {
        ...newState,
        [categoryId]: !prev[categoryId],
      };
    });
  };

  const handleAddSubCategory = async (id) => {
    try {
      await axiosInstance.post(`store/${store.id}/subcategory/${id}`);
      setActiveSubCategory(id);
      setOpenCategories(false);
      toast.success(t("success"));
      dispatch(fetchStores());
      getStore();
    } catch (err) {
      toast.error(t("error"));
      console.log(err);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    try {
      await axiosInstance.delete(`store/${store.id}/subcategory/${id}`);
      toast.success(t("success"));
      dispatch(fetchStores());
      getStore();
    } catch (err) {
      toast.error(t("error"));
      console.log(err);
    }
  };

  const handleDescriptionSubmit = async () => {
    if (!description.trim()) return toast.warning(t("specifyDescription"));
    try {
      await axiosInstance.patch(`/store/${store.id}`, {
        description,
      });
      toast.success(t("success"));
      setDescription("");
      getStore();
    } catch (err) {
      toast.error(t("error"));
      console.log(err);
    }
  };

  const handleAddCarouselImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return toast.warning(t("selectImage"));

    const formData = new FormData();
    formData.append("carouselImages", file);

    try {
      await axiosInstance.post(`/store/${store.id}/carousel-images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(t("success"));
      getStore();
      dispatch(fetchStores());
    } catch (error) {
      toast.error(t("error"));
      console.error(error);
    }
  };

  const handleDeleteCarouselImage = async (imagePath) => {
    try {
      await axiosInstance.delete(`store/${store.id}/carousel-image`, {
        data: { imagePath },
      });
      toast.success(t("success"));
      dispatch(fetchStores());
      getStore();
    } catch (err) {
      toast.error(t("storePanel:errorOnDelete"));
    }
  };

  const updateStoreVisibility = async (store) => {
    try {
      await axiosInstance.patch(`/store/${store.id}`, {
        isVisible: !store.isVisible,
      });
      dispatch(fetchStores());
      getStore();
      toast.success(t("visibilityUpdated"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  useEffect(() => {
    if (status === "succeeded") {
      if (!user || user.role !== "STORE_OWNER") {
        navigate("/", { replace: true });
      } else {
        dispatch(fetchLabeled());
        getStore();
      }
    }
  }, [user, status, navigate, getStore]);

  if (status === "loading" || !user || user.role !== "STORE_OWNER") {
    return null;
  }

  return (
    <section className="content__wrapper content__wrapper__own">
      <div className="content">
        <StoreHeader t={t} />

        <div className="flex flex-col gap-14">
          {store && (
            <div className="flex gap-10 w-full justify-center items-center visualize__panel">
              <div className="flex flex-col items-center main_image max-w-[230px]">
                <h1 className="text-center mb-2 text-lg">{t("mainImage")}</h1>
                <button
                  className="bg-orange py-2 px-12 rounded-lg"
                  onClick={() => document.getElementById("image-input").click()}
                >
                  {t("selectFile")}
                </button>
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  onClick={handleSubmitImage}
                  className="bg-orange py-2 px-12 rounded-lg mt-4 w-full"
                >
                  {t("save")}
                </button>
                <div className="flex items-center gap-3 justify-between mt-3">
                  <p className="text-orange">{t("visibility")}</p>
                  <span
                    className={`border border-white/30 w-[50px] h-[25px] rounded-full relative cursor-pointer transition-colors ${
                      store.isVisible ? "bg-orange" : "bg-darkness"
                    }`}
                    onClick={() => updateStoreVisibility(store)}
                  >
                    <div
                      className={`bg-white h-full w-1/2 rounded-full absolute left-0 transition-all ${
                        store.isVisible ? "translate-x-full" : ""
                      }`}
                    ></div>
                  </span>
                </div>
              </div>

              <div className="flex-col justify-center max-w-[313px] w-full flex items-center preview__image">
                <h1 className="text-center mb-5 text-2xl">
                  {t("visualization")}
                </h1>
                <div className="w-full h-[245px] rounded-[20px] overflow-hidden relative select-none">
                  <img
                    src={store.mainImage ? URL + store.mainImage : bootImage}
                    alt="Store Image"
                    className="w-full h-[200px] object-cover select-none pointer-events-none"
                  />
                  <span className="absolute bottom-0 left-0 bg-black w-full h-[20%] flex items-center px-4 justify-between">
                    <div className="flex items-center">
                      <img src={logo} alt="Логотип" className="mr-2 w-[30px]" />
                      <p className="truncate font-SaharHeavy">{store.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {store.filters?.map((labeled) => {
                        return (
                          <img
                            key={labeled.id}
                            src={URL + labeled.imageUrl}
                            alt=""
                            className="h-[21px] max-w-[21px] object-cover rounded-full border border-transparent hover:border-red-500 cursor-pointer transition-colors"
                            onClick={() => handleRemoveLabeled(labeled.id)}
                          />
                        );
                      })}
                    </div>
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center max-w-[230px] name__store">
                <h1 className="text-center mb-2 text-lg">{t("storeName")}</h1>
                <input
                  className="border border-[#fe9f22]/50 py-2 rounded-lg outline-none w-full font-SaharHeavy placeholder:text-white px-4 bg-transparent transition-colors focus:border-orange"
                  placeholder={t("name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button
                  className="bg-orange py-2 px-12 rounded-lg mt-4 w-full"
                  onClick={handleNameSubmit}
                >
                  {t("save")}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center">
            <h1 className="text-center mb-5 text-2xl">
              {t("storeDescription")}
            </h1>
            <textarea
              name=""
              id=""
              className="bg-darkness/60 w-[50%] rounded-md border border-orange/50 outline-none focus:border-orange transition-colors py-1 px-4 focus:bg-darkness resize-none h-[130px]"
              placeholder={store?.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <button
              onClick={handleDescriptionSubmit}
              className="bg-orange py-2 px-12 rounded-lg mt-4 w-full max-w-[313px]"
            >
              {t("save")}
            </button>
          </div>

          <div>
            <h1 className="text-center mb-5 text-2xl">{t("selectFilters")}</h1>
            {labeled && labeled.length >= 1 ? (
              <div className="flex flex-col items-center">
                <ul className="flex gap-3 items-center">
                  {labeled.map((filter) => (
                    <img
                      key={filter.id}
                      src={URL + filter.imageUrl}
                      alt=""
                      className={`h-[50px] max-w-[50px] object-cover rounded-full cursor-pointer transition-all duration-200 border-2 ${
                        selectedLabeled.includes(filter.id)
                          ? "border-yellow-500"
                          : ""
                      }`}
                      onClick={() => toggleLabeled(filter.id)}
                    />
                  ))}
                </ul>
                <button
                  className="bg-orange py-2 px-12 rounded-lg mt-5 max-w-[313px] w-full"
                  onClick={onSubmitLabeled}
                >
                  {t("add")}
                </button>
              </div>
            ) : (
              <h1 className="text-center mb-2 text-lg">{t("filtersExist")}</h1>
            )}
          </div>

          <div>
            <h1 className="text-center mb-5 text-2xl">{t("categories")}</h1>
            {store && (
              <div className="w-full flex justify-between  border border-orange/50 p-3 rounded-md gap-4 categories__wrapper__panel">
                <div className="flex flex-col gap-2 items-center w-full">
                  <h1 className="text-center mb-2 text-lg">
                    {t("allCategories")}
                  </h1>
                  {categories && categories.length >= 1 ? (
                    <ul className="grid grid-cols-3 gap-x-2 gap-y-4 items-start  rounded-[20px] justify-center w-full grid__ctg">
                      {categories.map((category) => (
                        <li
                          key={category.id}
                          className="relative category__item__panel"
                        >
                          <div
                            className="cursor-pointer font-semibold text-lg flex items-center gap-2 justify-between p-2 px-4 bg-darkness rounded-md border border-orange/50"
                            onClick={() => toggleCategory(category.id)}
                          >
                            <p className="truncate" title={category.name}>
                              {category.name}
                            </p>
                            <span
                              className="transition-all"
                              style={{
                                transform: openCategories[category.id]
                                  ? "rotate(90deg)"
                                  : "rotate(0deg)",
                              }}
                            >
                              <IoIosArrowForward />
                            </span>
                          </div>

                          <div
                            className={`overflow-hidden transition-al duration-500 ease-in-out flex flex-col absolute top-[105%] w-full z-20 rounded-md ${
                              openCategories[category.id]
                                ? "opacity-1 pointer-events-auto"
                                : "opacity-0 pointer-events-none"
                            }`}
                          >
                            <ul className="bg-spaceGray w-full rounded-md border border-orange/50">
                              {category.subcategories.length > 0 ? (
                                category.subcategories.map((sub) => (
                                  <li
                                    key={sub.id}
                                    className={`cursor-pointer transition-colors bg-darkness p-2 hover:bg-gray rounded-md`}
                                    onClick={() => handleAddSubCategory(sub.id)}
                                  >
                                    {sub.name}
                                  </li>
                                ))
                              ) : (
                                <li
                                  className={`transition-colors bg-darkness p-2`}
                                >
                                  {t("absent")}
                                </li>
                              )}
                            </ul>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center">{t("categoriesAbsent")}</p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-start w-full gap-2">
                  <h1 className="text-center mb-2 text-lg">
                    {t("activeCategories")}
                  </h1>
                  {store.subcategories?.length > 0 ? (
                    <ul className="grid grid-cols-3 w-full gap-y-5 gap-x-2 grid__ctg">
                      {store.subcategories.map((activeSub) => (
                        <li
                          key={activeSub.id}
                          className="cursor-pointer bg-darkness px-4 p-2 rounded-md flex justify-between gap-4 items-center border border-transparent transition-colors hover:border-red-400 hover:bg-red-400/30"
                          onClick={() => handleDeleteSubCategory(activeSub.id)}
                        >
                          <p className="truncate">{activeSub.name}</p>
                          <IoClose />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <h1 className="text-center mb-2 text-base">
                      {t("categoriesAbsent")}
                    </h1>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col items-center">
            <h1 className="text-center flex items-center gap-2 text-2xl mb-5">
              <p>{t("carousel")}</p>
              <FaPlus className="text-orange text-base" />
            </h1>
            <div className="w-full border border-orange/50 p-3 rounded-md categories__wrapper__panel">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full grid__overview__store">
                <div
                  className="bg-orange/50 flex items-center justify-center aspect-[16/9] cursor-pointer order-first rounded-md transition-colors hover:bg-orange"
                  onClick={() =>
                    document.getElementById("carousel-image-input").click()
                  }
                >
                  <FaPlus className="text-[#202020] text-4xl" />
                </div>

                <input
                  type="file"
                  id="carousel-image-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddCarouselImage}
                />

                {store?.carouselImages.map((image, i) => (
                  <div
                    className="relative w-full aspect-[16/9]"
                    onClick={() => handleDeleteCarouselImage(image)}
                    key={i}
                  >
                    <img
                      src={URL + image}
                      alt=""
                      className="w-full h-full object-cover border border-transparent hover:border-red-500 cursor-pointer rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorePanel;
