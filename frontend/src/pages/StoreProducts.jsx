import { useDispatch, useSelector } from "react-redux";
import StoreHeader from "../components/StoreHeader";
import { useEffect, useState } from "react";
import { TiPlus } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import { toast } from "react-sonner";
import axiosInstance from "../utils/axiosInstance";
import settingsIcon from "/web-images/settings-icon.svg";
import { IoCopyOutline } from "react-icons/io5";
import { FaTrashAlt } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { TiArrowSortedDown } from "react-icons/ti";

const ProductList = ({
  title,
  products,
  bgColor,
  getProducts,
  handleOpenUpdateProduct,
  t,
}) => {
  if (!products.length) return null;

  const handleCopy = (data) => {
    toast.success(t("copied"));
    window.navigator.clipboard.writeText(data);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axiosInstance.delete(`/product/${productId}`);
      toast.success(t("productDeleted"));
      getProducts();
    } catch (err) {
      toast.error(t("error"));
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 w-full">
      <h2
        className={`px-4 py-2 rounded-[7px] flex items-center gap-3 ${bgColor}`}
      >
        {title}
      </h2>
      <ul className="flex flex-col gap-6 w-full">
        {products.map((product) => (
          <li
            className="w-full flex items-center gap-3 text-nowrap items__product__wrapper"
            key={product.id}
          >
            <div className="bg-gray rounded-2xl py-4 px-8 grid grid-cols-6 w-full items-center product__item">
              <p className="truncate" title={product.name}>
                {product.name}
              </p>
              <p
                className="flex gap-2 truncate"
                title={`${product.quantity} ${product.type}`}
              >
                <span className="text-orange">{product.quantity}</span>
                <span>{product.type}</span>
              </p>
              <p className="truncate" title={product.description}>
                {product.description}
              </p>
              <p className="truncate" title={product.comment}>
                {product.comment}
              </p>
              <p className="truncate text-orange" title={product.price}>
                {product.price} KZT
              </p>
              <img
                src={settingsIcon}
                alt=""
                onClick={() => handleOpenUpdateProduct(product)}
                className="w-[20px] ml-auto cursor-pointer transition-opacity hover:opacity-[0.6] stngs__product__icon"
              />
            </div>
            <div className="flex items-center gap-2 btns__store__product">
              <span
                className="flex items-center gap-1 bg-darkness p-4 rounded-xl cursor-pointer transition-opacity hover:opacity-[0.6]"
                onClick={() => handleCopy(product.id)}
              >
                ID <IoCopyOutline />
              </span>
              <span
                className="flex items-center gap-1 bg-red-500 p-4 rounded-xl cursor-pointer transition-opacity hover:opacity-[0.6]"
                onClick={() => handleDeleteProduct(product.id)}
              >
                <FaTrashAlt className="text-2xl" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const StoreProducts = ({ t }) => {
  const [showProductModalType, setShowProductModalType] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [products, setProducts] = useState([]);
  const [showUpdateProduct, setShowUpdateProduct] = useState(false);
  const [updateProductData, setUpdateProductData] = useState({});
  const [storeBalance, setStoreBalance] = useState(0);

  const user = useSelector((state) => state.user.user);
  const status = useSelector((state) => state.user.status);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [type, setType] = useState("ШТ");
  const [showType, setShowType] = useState(null);

  const getProducts = async () => {
    try {
      const response = await axiosInstance(`/product/owner/${user.id}`);
      setProducts(response.data);
    } catch {
      toast.error(t("errorReceivingGoods"));
    }
  };

  const getBalance = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await axiosInstance.get(`/payment/store-balance/${user.id}`);
      if (response.data.success) {
        setStoreBalance(response.data.balance);
      } else {
        console.error("Error getting balance:", response.data.error);
      }
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  };

  const handleChangePrice = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, "");

    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) return;

    setPrice(value);
  };

  const handleChangeQuantity = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, "");

    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) return;

    setQuantity(value);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!price || !name || !description || !quantity || attachedFiles.length === 0)
      return toast.warning(t("fillAllFields"));

    try {
      await axiosInstance.post(`product/${user.store.id}`, {
        name,
        description,
        price: parseFloat(price),
        type,
        comment,
        quantity: parseFloat(quantity),
        attachedFiles,
      });
      getProducts();
      setShowType(false);
      setShowModalAdd(false);
      setName("");
      setDescription("");
      setPrice("");
      setComment("");
      setQuantity("");
      setAttachedFiles([]);
      toast.success(t("success"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleOpenUpdateProduct = (product) => {
    setUpdateProductData(product);
    setShowUpdateProduct(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;

    setUpdateProductData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "quantity"
          ? value === "" || isNaN(value)
            ? 0
            : parseFloat(value)
          : value,
    }));
  };

  const handleChangeType = (newType) => {
    setShowProductModalType(false);
    setUpdateProductData((prev) => ({
      ...prev,
      type: newType,
    }));
  };

  const handleChangePrType = (newType) => {
    setType(newType);
    setShowType(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axiosInstance.post(`/product/upload-files/${user.store.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setAttachedFiles(prev => [...prev, ...response.data.filePaths]);
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = async () => {
    const updatedFields = {};

    for (const key in updateProductData) {
      if (updateProductData[key] !== "" && updateProductData[key] !== null) {
        updatedFields[key] =
          key === "price" || key === "quantity"
            ? parseFloat(updateProductData[key]) || 0
            : updateProductData[key];
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      toast.warning(t("fillInAtLeastOneField"));
      return;
    }

    try {
      await axiosInstance.patch(
        `/product/${updateProductData.id}`,
        updatedFields
      );
      toast.success("Товар обновлен");
      getProducts();
      setShowProductModalType(false);
      setShowUpdateProduct(false);
    } catch (err) {
      toast.error(t("productUpdateError"));
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "STORE_OWNER") {
      navigate("/");
      return;
    }

    getProducts();
    
    if (user && user.id) {
      getBalance();
    }
  }, [user, status, navigate]);

  if (status === "loading" || !user || user.role !== "STORE_OWNER") {
    return null;
  }

  return (
    <section className="content__wrapper content__wrapper__own relative">
      <div className="content">
        <StoreHeader t={t} />
        <div className="flex flex-col gap-10 items-start">
          <div className="w-full flex justify-end mb-5 px-5">
            <div className="bg-gray rounded-2xl py-3 px-6 flex items-center gap-3">
              <span className="font-bold">{t("storeBalance")}:</span>
              <span className="text-orange font-semibold">{storeBalance} KZT</span>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-[7px] flex items-center gap-3 bg-greenCs"
            onClick={() => setShowModalAdd(true)}
          >
            <TiPlus />
            <p>{t("addProduct")}</p>
          </button>

          <ProductList
            getProducts={getProducts}
            title={t("active")}
            products={products.filter((p) => p.quantity > 0)}
            bgColor="bg-orange"
            handleOpenUpdateProduct={handleOpenUpdateProduct}
            t={t}
          />

          <ProductList
            title={t("expired")}
            products={products.filter((p) => p.quantity <= 0)}
            bgColor="bg-lightGray"
            getProducts={getProducts}
            handleOpenUpdateProduct={handleOpenUpdateProduct}
            t={t}
          />
        </div>
      </div>

      <div
        className={`transition-opacity absolute w-full h-full bg-black/40 backdrop-blur-sm top-0 left-0 flex items-center justify-center z-40 px-5  ${
          showModalAdd
            ? "pointer-events-auto opacity-1"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="max-w-[1280px] w-full bg-[#333333] rounded-[20px] relative border-4 border-[#808080] overflow-hidden modal__add__product">
          <div className="text-center py-3 px-2 bg-[#808080] relative">
            <IoCloseSharp
              className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl cursor-pointer"
              onClick={() => setShowModalAdd(false)}
            />
            <h3>{t("add")}</h3>
          </div>

          <form
            className="px-40 py-20 pb-5 form__body__add_product"
            onSubmit={handleCreateProduct}
          >
            <ul className="grid grid-cols-2 gap-x-40 gap-y-10">
              <li className="flex flex-col">
                <p className="font-bold pl-4">{t("productName")}</p>
                <input
                  type="text"
                  className="bg-[#808080] py-2 px-4 outline-none rounded-[10px]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </li>

              <li className="flex flex-col">
                <p className="font-bold pl-4">{t("type")}</p>
                <div className="relative">
                  <div
                    className="bg-[#808080] py-2 px-4 outline-none rounded-[10px] flex justify-between items-center cursor-pointer relative"
                    onClick={() => setShowType(!showType)}
                  >
                    <p>{type}</p>
                    <TiArrowSortedDown
                      className={`text-2xl transition-transform ${
                        showType && "-rotate-180"
                      }`}
                    />
                  </div>

                  <div
                    className={`absolute top-[110%] w-full left-0 z-40 bg-[#808080] transition-opacity flex flex-col gap-1 rounded-[10px] ${
                      showType && showModalAdd
                        ? "opacity-1 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div
                      className="cursor-pointer px-4 py-2 transition-colors hover:bg-spaceGray"
                      onClick={() => handleChangePrType("ШТ")}
                    >
                      ШТ
                    </div>
                    <div
                      className="cursor-pointer px-4 py-2 transition-colors hover:bg-spaceGray"
                      onClick={() => handleChangePrType("КГ")}
                    >
                      КГ
                    </div>
                    <div
                      className="cursor-pointer px-4 py-2 transition-colors hover:bg-spaceGray"
                      onClick={() => handleChangePrType("ГР")}
                    >
                      ГР
                    </div>
                  </div>
                </div>
              </li>

              <li className="flex flex-col">
                <p className="font-bold pl-4">{t("productDescription")}</p>
                <input
                  type="text"
                  className="bg-[#808080] py-2 px-4 outline-none rounded-[10px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </li>

              <li className="flex flex-col">
                <p className="font-bold pl-4">{t("productComment")}</p>
                <input
                  type="text"
                  className="bg-[#808080] py-2 px-4 outline-none rounded-[10px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </li>

              <li className="flex flex-col">
                <p className="font-bold pl-4">{t("productPricePanel")}</p>
                <input
                  type="text"
                  className="bg-[#808080] py-2 px-4 outline-none rounded-[10px]"
                  value={price}
                  onChange={handleChangePrice}
                />
              </li>

              <li className="flex flex-col">
                <p className="font-bold pl-4">{t("productQuantity")}</p>
                <input
                  type="text"
                  className="bg-[#808080] py-2 px-4 outline-none rounded-[10px]"
                  value={quantity}
                  onChange={handleChangeQuantity}
                />
              </li>
            </ul>

            <div className="mt-10">
              <p className="font-bold pl-4 mb-4">Attach Files for Buyers (Required)</p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="bg-[#808080] py-2 px-4 outline-none rounded-[10px] w-full"
              />
              {attachedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="font-bold mb-2">Attached Files:</p>
                  <ul className="space-y-2">
                    {attachedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-[#555555] p-2 rounded">
                        <span>{file}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-20 flex items-center justify-center">
              <button
                className="font-bold py-3 mb-14 bg-[#7ac810] px-20 rounded-[10px]"
                type="submit"
              >
                {t("save")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`transition-opacity absolute w-full h-full bg-black/40 backdrop-blur-sm top-0 left-0 flex items-center justify-center z-40 px-5 ${
          showUpdateProduct
            ? "opacity-1 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="modal bg-gray p-5 relative rounded-md">
          <IoCloseSharp
            className="close-icon absolute right-5 top-5 text-2xl cursor-pointer transition-colors hover:text-orange"
            onClick={() => setShowUpdateProduct(false)}
          />
          <h1 className="text-center mb-5 text-2xl">{t("editingProduct")}</h1>
          <div className="grid grid-cols-2 gap-2 update__pr">
            <input
              type="text"
              name="name"
              placeholder={t("productName")}
              value={updateProductData.name || ""}
              onChange={handleUpdateChange}
              className="bg-transparent py-2 px-4 border border-orange/50 focus:border-orange rounded-md outline-none"
            />
            <div className="flex gap-1 items-center relative">
              <input
                type="number"
                name="quantity"
                step="any"
                placeholder={t("productQuantity")}
                value={updateProductData.quantity}
                onChange={handleUpdateChange}
                className="bg-transparent py-2 px-4 border border-orange/50 focus:border-orange rounded-md outline-none"
              />
              <div
                className="border border-orange/50 py-2 px-4 outline-none rounded-[10px] flex justify-between items-center cursor-pointer relative"
                onClick={() => setShowProductModalType(!showProductModalType)}
              >
                <p>{updateProductData.type}</p>
                <TiArrowSortedDown
                  className={`text-2xl transition-transform ${
                    showType && "-rotate-180"
                  }`}
                />
              </div>
              <div
                className={`absolute top-[110%] w-full left-0 z-40 bg-darkness transition-opacity flex flex-col gap-1 rounded-[10px] ${
                  showProductModalType && showUpdateProduct
                    ? "opacity-1 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <div
                  className="cursor-pointer px-4 py-2 transition-colors hover:bg-orange rounded-md"
                  onClick={() => handleChangeType("ШТ")}
                >
                  ШТ
                </div>
                <div
                  className="cursor-pointer px-4 py-2 transition-colors hover:bg-orange rounded-md"
                  onClick={() => handleChangeType("КГ")}
                >
                  КГ
                </div>
                <div
                  className="cursor-pointer px-4 py-2 transition-colors hover:bg-orange rounded-md"
                  onClick={() => handleChangeType("ГР")}
                >
                  ГР
                </div>
              </div>
            </div>
            <input
              type="text"
              name="description"
              placeholder={t("productDescription")}
              value={updateProductData.description || ""}
              onChange={handleUpdateChange}
              className="bg-transparent py-2 px-4 border border-orange/50 focus:border-orange rounded-md outline-none"
            />
            <input
              type="text"
              name="comment"
              placeholder={t("productComment")}
              value={updateProductData.comment || ""}
              onChange={handleUpdateChange}
              className="bg-transparent py-2 px-4 border border-orange/50 focus:border-orange rounded-md outline-none"
            />
            <input
              type="number"
              name="price"
              placeholder={t("productPricePanel")}
              value={updateProductData.price || ""}
              onChange={handleUpdateChange}
              className="bg-transparent py-2 px-4 border border-orange/50 focus:border-orange rounded-md outline-none"
            />
          </div>
          
          <div className="mt-4">
            <p className="font-bold mb-2">Attached Files:</p>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const fileNames = files.map(file => file.name);
                setUpdateProductData(prev => ({
                  ...prev,
                  attachedFiles: [...(prev.attachedFiles || []), ...fileNames]
                }));
              }}
              className="bg-transparent py-2 px-4 border border-orange/50 focus:border-orange rounded-md outline-none w-full"
            />
            {updateProductData.attachedFiles && updateProductData.attachedFiles.length > 0 && (
              <div className="mt-2">
                <ul className="space-y-1">
                  {updateProductData.attachedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray p-2 rounded">
                      <span>{file}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUpdateProductData(prev => ({
                            ...prev,
                            attachedFiles: prev.attachedFiles.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={handleUpdateProduct}
            className="py-2 px-4 w-full bg-orange rounded-md mt-2 transition-opacity hover:opacity-[0.6]"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default StoreProducts;
