import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import bootImage from "/web-images/shop-boot.jpg";
import logo from "/web-images/logo.svg";
import closeIcon from "/web-images/close-icon.svg";

const Shops = ({ t }) => {
  const URL = import.meta.env.VITE_BACKEND_URL;

  const stores = useSelector((state) => state.stores.stores);
  const categories = useSelector((state) => state.categories.categories);
  console.log(categories);

  const [openCategories, setOpenCategories] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filteredShops, setFilteredShops] = useState(stores);
  const [showFiters, setShowFilters] = useState(true);

  const handleCategoryClick = (categoryId) => {
    setOpenCategories((prevOpenCategories) =>
      prevOpenCategories.includes(categoryId)
        ? prevOpenCategories.filter((id) => id !== categoryId)
        : [...prevOpenCategories, categoryId]
    );
  };

  const handleSubcategoryClick = (subcategoryId) => {
    setActiveFilters((prevFilters) =>
      prevFilters.includes(subcategoryId)
        ? prevFilters.filter((id) => id !== subcategoryId)
        : [...prevFilters, subcategoryId]
    );
  };

  const handleResetFilters = () => {
    setActiveFilters([]);
    setOpenCategories([]);
  };

  useEffect(() => {
    if (activeFilters.length > 0) {
      const filtered = stores.filter((store) =>
        store.subcategories.some((subcategory) =>
          activeFilters.includes(subcategory.id)
        )
      );
      setFilteredShops(filtered);
    } else {
      setFilteredShops(stores);
    }
  }, [activeFilters, stores]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 mb-20 items-start store__wrapper">
      {showFiters && (
        <div className="w-full lg:max-w-[200px] bg-[#1a1a1a8c] rounded-[20px] font-bold pb-5 categories__wrapper relative">
          <img
            src={closeIcon}
            alt=""
            className="w-[15px] absolute top-2 left-4 hidden close__filters__mobile"
            onClick={() => setShowFilters(false)}
          />
          <p className="bg-orange py-2 px-4 rounded-full select-none text-center uppercase mb-1">
            {t("filters")}
          </p>
          <p
            className="bg-orange py-2 px-4 rounded-full select-none text-center uppercase cursor-pointer reset__category__btn"
            onClick={handleResetFilters}
          >
            {t("reset")}
          </p>

          <ul className="flex flex-col gap-2 py-2 w-full px-4 select-none category__wrapper">
            {categories &&
              categories
                .filter((item) => item.subcategories.length > 0)
                .map((category) => {
                  const isOpen = openCategories.includes(category.id);
                  return (
                    <li key={category.id} className="category__item">
                      <p
                        className={`cursor-pointer transition-colors hover:text-mainYellow category__title ${
                          isOpen ? "text-orange" : "border__full__btn"
                        }`}
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        {category.name}
                      </p>

                      <div
                        className={`${
                          isOpen
                            ? "max-h-screen opacity-1 pointer-events-auto"
                            : "max-h-0 opacity-0 pointer-events-none absolute"
                        } overflow-hidden transition-all duration-500 ease pl-4 text-sm subcategories__wrapper`}
                      >
                        {category.subcategories &&
                          category.subcategories.length >= 1 &&
                          category.subcategories.map((subcategory) => (
                            <p
                              key={subcategory.id}
                              className={`cursor-pointer transition-colors hover:text-mainYellow ${
                                activeFilters.includes(subcategory.id)
                                  ? "text-orange"
                                  : ""
                              }`}
                              onClick={() =>
                                handleSubcategoryClick(subcategory.id)
                              }
                            >
                              {subcategory.name}
                            </p>
                          ))}
                      </div>
                    </li>
                  );
                })}
          </ul>
        </div>
      )}

      {!showFiters && (
        <button
          className="py-2 px-4 bg-orange mx-auto rounded-full"
          onClick={() => setShowFilters(true)}
        >
          {t("filters")}
        </button>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full bg-[#1a1a1a8c] py-6 px-5 rounded-[20px] lg:py-6 lg:px-10 sm:px-10 sm:py-6">
        {filteredShops && filteredShops.length > 0 ? (
          filteredShops.map((shop) => (
            <Link
              to={`store/${shop.id}`}
              key={shop.id}
              className="w-full h-[245px] rounded-[20px] overflow-hidden relative select-none cursor-pointer"
            >
              <img
                src={shop.mainImage ? URL + shop.mainImage : bootImage}
                alt=""
                className="w-full h-[200px] object-cover select-none pointer-events-none"
              />
              <span className="absolute bottom-0 left-0 bg-black w-full h-[20%] flex items-center px-4 justify-between">
                <div className="flex items-center w-full">
                  <img
                    src={logo}
                    alt=""
                    className="max-w-[30px] select-none pointer-events-none mr-2"
                  />
                  <p className="truncate font-SaharHeavy">{shop.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  {shop.filters?.map((filter) => (
                    <img
                      key={filter.id}
                      src={URL + filter.imageUrl}
                      alt=""
                      className="h-[21px] max-w-[21px] object-cover rounded-full"
                    />
                  ))}
                </div>
              </span>
            </Link>
          ))
        ) : (
          <p className="text-center text-xl text-gray-400 col-span-full">
            {t("shopExist")}
          </p>
        )}
      </ul>
    </div>
  );
};
export default Shops;
