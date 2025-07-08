import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUsers } from "../store/usersSlice";
import { IoCopyOutline } from "react-icons/io5";
import { toast } from "react-sonner";
import { FaUnlock } from "react-icons/fa6";
import { FaLock } from "react-icons/fa6";
import axiosInstance from "../utils/axiosInstance";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { fetchAllStores } from "../store/allStoresSlice";
import { fetchStores } from "../store/storeSlice";
import { fetchCategories } from "../store/categorySlice";
import { FaTrashCan } from "react-icons/fa6";
import { TiTick } from "react-icons/ti";
import { fetchLabeled } from "../store/labeledSlice";
import { FaPlus, FaMinus } from "react-icons/fa";
import { fetchOverview } from "../store/overviewSlice";
import { fetchChats } from "../store/chatsClice";
import { io } from "socket.io-client";
import { FaSmile } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";
import EmojiPicker from "emoji-picker-react";

const AdminPanel = ({ t }) => {
  const URL = import.meta.env.VITE_BACKEND_URL;
  const [socket, setSocket] = useState(null);

  const [overviewImage, setOverviewImage] = useState();
  const [overviewName, setOverviewName] = useState("");
  const [overviewUrl, setOverviewUrl] = useState("");

  const [searchUser, setSearchUser] = useState("");
  const [filterUsers, setFilterUsers] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentStorePage, setCurrentStorePage] = useState(1);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const categoryPerPage = 9;
  const usersPerPage = 9;
  const storesPerPage = 9;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [admin, setAdmin] = useState(null);
  const [shop, setShop] = useState(null);

  const categories = useSelector((state) => state.categories.categories);
  const users = useSelector((state) => state.users.users);
  const user = useSelector((state) => state.user.user);
  const chats = useSelector((state) => state.chats.chats);
  const status = useSelector((state) => state.user.status);
  const stores = useSelector((state) => state.allStores.allStores);
  const labeled = useSelector((state) => state.labeled.labeled);
  const overview = useSelector((state) => state.overview.overview);

  const [chatsCurrentPage, setChatsCurrentPage] = useState(1);
  const chatsPerPage = 4;

  const totalChatsPages = Math.ceil(chats.length / chatsPerPage);
  const visibleChats = chats.slice(
    (chatsCurrentPage - 1) * chatsPerPage,
    chatsCurrentPage * chatsPerPage
  );

  const handleChatsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalChatsPages) {
      setChatsCurrentPage(newPage);
    }
  };

  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    if (socket && messageInput.trim()) {
      socket.emit("send_message", messageInput);
      setMessageInput("");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerVisible((prev) => !prev);
  };

  const addEmojiToMessage = (emoji) => {
    setMessageInput((prev) => prev + emoji);
    setIsEmojiPickerVisible(false);
  };

  const [categoryName, setCategoryName] = useState("");
  const [subCategoryNames, setSubCategoryNames] = useState({});

  const roleLabels = {
    ADMIN: t("admin"),
    STORE_OWNER: t("storeOwner"),
    USER: t("user"),
  };

  const filteredUsers = (users || []).filter(
    (user) => !filterUsers || user.role === filterUsers
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalStorePages = Math.ceil(stores.length / storesPerPage);
  const displayedStores = stores.slice(
    (currentStorePage - 1) * storesPerPage,
    currentStorePage * storesPerPage
  );

  const totalCategoriesPages = Math.ceil(categories.length / storesPerPage);
  const displayedCategories = categories.slice(
    (currentCategoryPage - 1) * categoryPerPage,
    currentCategoryPage * categoryPerPage
  );

  const handleCopy = (data) => {
    window.navigator.clipboard.writeText(data);
    toast.success(t("copied"));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStorePageChange = (page) => {
    if (page >= 1 && page <= totalStorePages) {
      setCurrentStorePage(page);
    }
  };

  const handleCategoriesPageChange = (page) => {
    if (page >= 1 && page <= totalCategoriesPages) {
      setCurrentCategoryPage(page);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const response = await axiosInstance.post("/admin/create-admin");
      setAdmin(response.data);
      dispatch(fetchUsers());
      toast.success(t("userCreated"));
    } catch (err) {
      toast.success(t("errorOnCreateUser"));
    }
  };

  const handleCreateShop = async () => {
    try {
      const response = await axiosInstance.post("/admin/create-shop");
      setShop(response.data);
      dispatch(fetchStores());
      dispatch(fetchUsers());
      dispatch(fetchAllStores());
      toast.success("Магазин создан");
    } catch (err) {
      toast.success(t("errorOnShopCreate"));
    }
  };

  const handleFilterChange = (role) => {
    setFilterUsers(role);
    setCurrentPage(1);
  };

  const handleBlockUser = async (id) => {
    try {
      await axiosInstance.post(`/admin/user-block/${id}`);
      toast.success(t("userBlocked"));
      dispatch(fetchUsers());
    } catch (err) {
      toast.error(t("userBlockedError"));
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      await axiosInstance.post(`/admin/user-unblock/${id}`);
      toast.success(t("userUnblocked"));
      dispatch(fetchUsers());
    } catch (err) {
      toast.error(t("userUnblockedError"));
    }
  };

  const updateStoreVisibility = async (store) => {
    try {
      await axiosInstance.patch(`/store/${store.id}`, {
        isVisible: !store.isVisible,
      });
      dispatch(fetchAllStores());
      dispatch(fetchStores());
      toast.success(t("visibilityUpdated"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return toast.warning(t("specifyNameCategory"));

    try {
      await axiosInstance.post("category/create", {
        name: categoryName,
      });
      toast.success(t("categoryCreated"));
      dispatch(fetchCategories());
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axiosInstance.delete(`category/${id}`);
      toast.success(t("categoryDeleted"));
      dispatch(fetchCategories());
    } catch (err) {
      toast.error(t("categoryDeletedError"));
    }
  };

  const handleCreateSub = async (categoryId) => {
    const name = subCategoryNames[categoryId];
    if (!name) return toast.warning(t("specifyNameSubcategory"));
    try {
      await axiosInstance.post(`category/${categoryId}/subcategory`, { name });
      toast.success(t("subCategoryCreated"));
      dispatch(fetchCategories());
      setSubCategoryNames((prev) => ({ ...prev, [categoryId]: "" }));
    } catch (err) {
      toast.error(t("subCategoryCreateError"));
    }
  };

  const handleDeleteSub = async (id) => {
    try {
      await axiosInstance.delete(`category/subcategory/${id}`);
      toast.success(t("success"));
      dispatch(fetchCategories());
    } catch (err) {
      toast.success(t("error"));
    }
  };

  const handleDeleteLabeled = async (id) => {
    try {
      await axiosInstance.delete(`filters/${id}`);
      dispatch(fetchLabeled());
      toast.success(t("success"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleAddFilterImage = async () => {
    const file = event.target.files[0];
    if (!file) return toast.warning(t("fileNotSelected"));

    const formData = new FormData();
    formData.append("filterImage", file);

    try {
      await axiosInstance.post(`/filters/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      dispatch(fetchLabeled());

      toast.success(t("imageAdded"));
    } catch (err) {
      toast.error(t("errorOnFilterAdd"));
    }
  };

  const handleImageChange = (event) => {
    setOverviewImage(event.target.files[0]);
  };

  const handleAddOverviewImage = async () => {
    const formData = new FormData();
    if (overviewImage) {
      formData.append("overview", overviewImage);
    }
    formData.append("paymentUrl", overviewUrl);
    formData.append("text", overviewName);

    try {
      await axiosInstance.post(`/overview`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      dispatch(fetchOverview());
      toast.success(t("success"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleDeleteOverview = async (imageId) => {
    try {
      await axiosInstance.delete("/overview", {
        data: {
          imageId,
        },
      });
      dispatch(fetchOverview());
      toast.success(t("success"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleDeleteStore = async (storeId) => {
    try {
      await axiosInstance.delete(`/admin/delete-shop/${storeId}`);
      dispatch(fetchUsers());
      dispatch(fetchStores());
      dispatch(fetchAllStores());
      toast.success(t("storeSuccessDeleted"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axiosInstance.delete(`/chat/${chatId}`);
      dispatch(fetchChats());
      toast.success(t("success"));
    } catch (err) {
      toast.error(t("error"));
    }
  };

  const handleChatConnect = (chatId, chatUsers) => {
    if (socket) {
      socket.disconnect();
    }

    const accessToken = localStorage.getItem("accessToken");

    const newSocket = io(URL, {
      query: { chatId },
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    newSocket.on("connect", () => {
      setMessages([]);

      const chatFilteredUsers = chatUsers.filter(
        (u) => u.role !== "SUPERADMIN"
      );
      const chatUsernames =
        chatFilteredUsers.length > 0
          ? chatFilteredUsers.map((u) => u.username).join(", ")
          : t("unknown");

      setCurrentChatUser(chatUsernames);
    });

    newSocket.on("chat_history", (chatHistory) => {
      setMessages(chatHistory);
      scrollToBottom();
    });

    newSocket.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    setSocket(newSocket);
  };

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceOperation, setBalanceOperation] = useState("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleOpenBalanceModal = (userId, operation) => {
    setSelectedUserId(userId);
    setBalanceOperation(operation);
    setBalanceAmount("");
    setShowBalanceModal(true);
  };

  const handleBalanceAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setBalanceAmount(value);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUserId || !balanceAmount || parseFloat(balanceAmount) <= 0) {
      toast.error(t("enterValidAmount"));
      return;
    }

    try {
      const amount = parseFloat(balanceAmount);
      
      const endpoint = balanceOperation === 'add' 
        ? `/admin/user-add-balance/${selectedUserId}` 
        : `/admin/user-subtract-balance/${selectedUserId}`;
      
      const response = await axiosInstance.post(endpoint, { amount });
      
      if (response.data.success) {
        toast.success(
          balanceOperation === 'add' 
            ? t("balanceIncreased") + `: +${amount} KZT` 
            : t("balanceDecreased") + `: -${amount} KZT`
        );
        dispatch(fetchUsers());
        setShowBalanceModal(false);
      } else {
        toast.error(response.data.error || t("error"));
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      const errorMessage = error.response?.data?.message || t("error");
      toast.error(errorMessage);
    }
  };

  const [headerButtons, setHeaderButtons] = useState([]);

  useEffect(() => {
    if (status === "succeeded") {
      if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
        navigate("/", { replace: true });
      }
    }
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
      dispatch(fetchUsers());
      dispatch(fetchAllStores());
    }
    if (user && user.role === "SUPERADMIN") {
      dispatch(fetchLabeled());
      dispatch(fetchChats());
    }
  }, [user, status, navigate]);

  useEffect(() => {
    const fetchHeaderButtons = async () => {
      try {
        const response = await axiosInstance.get('/header-buttons');
        setHeaderButtons(response.data);
      } catch (error) {
        console.error('Error fetching header buttons:', error);
        toast.error(t("error"));
      }
    };

    if (user?.role === "SUPERADMIN") {
      fetchHeaderButtons();
    }
  }, [user]);

  const handleUpdateHeaderButton = async (id, data) => {
    try {
      await axiosInstance.put(`/header-buttons/${id}`, data);
      const response = await axiosInstance.get('/header-buttons');
      setHeaderButtons(response.data);
      toast.success(t("success"));
    } catch (error) {
      console.error('Error updating header button:', error);
      toast.error(t("error"));
    }
  };

  if (
    status === "loading" ||
    !user ||
    (user.role !== "ADMIN" && user.role !== "SUPERADMIN")
  ) {
    return null;
  }

  return (
    <section className="content__wrapper content__wrapper__own">
      <div className="content flex flex-col gap-14">
        <div>
          <h1 className="text-center mb-5 text-2xl">{t("users")}</h1>
          <div className="flex items-center mb-5 justify-between users__btns__wrapper">
            <nav className="flex gap-3 users__filter">
              <p
                className="bg-orange py-2 px-4 rounded-md cursor-pointer"
                onClick={() => handleFilterChange("")}
              >
                {t("all")}
              </p>
              <p
                className="bg-orange py-2 px-4 rounded-md cursor-pointer"
                onClick={() => handleFilterChange("ADMIN")}
              >
                {t("admins")}
              </p>
              <p
                className="bg-orange py-2 px-4 rounded-md cursor-pointer"
                onClick={() => handleFilterChange("USER")}
              >
                {t("users")}
              </p>
              <p
                className="bg-orange py-2 px-4 rounded-md cursor-pointer"
                onClick={() => handleFilterChange("STORE_OWNER")}
              >
                {t("stores")}
              </p>
            </nav>

            {user?.role === "SUPERADMIN" && (
              <button
                className="bg-greenCs py-2 px-4 rounded-md cursor-pointer"
                onClick={handleCreateAdmin}
              >
                {t("createAdmin")}
              </button>
            )}
          </div>

          {admin && (
            <div className="flex w-full justify-end mb-4 created__ad__user__wrapper">
              <div className="flex gap-2 created__ad__user">
                <p className="flex items-center gap-3">
                  <span
                    className="bg-orange py-2 px-4 rounded-md border border-transparent cursor-pointer"
                    onClick={() => handleCopy(admin?.username)}
                  >
                    LOGIN:
                  </span>
                  <span className="py-2 px-4 border border-white/20 rounded-md">
                    {admin?.username}
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <span
                    className="bg-orange py-2 px-4 rounded-md border border-transparent cursor-pointer"
                    onClick={() => handleCopy(admin?.password)}
                  >
                    PASSWORD:
                  </span>
                  <span className="py-2 px-4 border border-white/20 rounded-md">
                    {admin?.password}
                  </span>
                </p>
              </div>
            </div>
          )}

          {displayedUsers.length > 0 ? (
            <div>
              <input
                type="text"
                className="w-full mb-2 py-2 px-4 border border-orange/50 bg-transparent focus:border-orange outline-none transition-colors rounded-md"
                placeholder={t("username")}
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
              <ul className="grid grid-cols-3 gap-5 users__wrapper">
                {displayedUsers
                  .filter((user) =>
                    user.username
                      .toLowerCase()
                      .includes(searchUser.toLowerCase())
                  )
                  .map((user) => (
                    <li
                      key={user.id}
                      className="border border-white/40 px-5 py-3 rounded-md flex flex-col gap-2"
                    >
                      <div className="border-l-4 border-orange pl-2 flex justify-between gap-3 item__usr__hsb">
                        <span className="text-orange">
                          {roleLabels[user?.role]}:
                        </span>
                        <p className="truncate" title={user.username}>
                          {user.username}
                        </p>
                      </div>

                      <div className="border-l-4 border-orange pl-2 flex justify-between item__usr__hsb">
                        <span className="text-orange">{t("createdAt")}:</span>
                        <p
                          className="truncate"
                          title={new Date(user.createdAt).toLocaleString()}
                        >
                          {new Date(user.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="border-l-4 border-orange pl-2 flex justify-between items-center item__usr__hsb">
                        <span className="text-orange mr-3">ID:</span>
                        <div className="flex items-center gap-2">
                          <p className="truncate" title={user.id}>
                            {user?.id}
                          </p>
                          <IoCopyOutline
                            className="cursor-pointer text-lg"
                            onClick={() => handleCopy(user?.id)}
                          />
                        </div>
                      </div>

                      {user.role === "STORE_OWNER" && (
                        <div className="border-l-4 border-orange pl-2 flex justify-between items-center item__usr__hsb">
                          <span className="text-orange mr-3">{t("balance")}:</span>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold">{user.balance || 0} KZT</p>
                            <button
                              onClick={() => handleOpenBalanceModal(user.id, 'add')}
                              className="flex items-center text-lg bg-green-500 p-1 px-2 rounded-md"
                              title={t("addBalance")}
                            >
                              <FaPlus />
                            </button>
                            <button
                              onClick={() => handleOpenBalanceModal(user.id, 'subtract')}
                              className="flex items-center text-lg bg-red-500 p-1 px-2 rounded-md"
                              title={t("subtractBalance")}
                            >
                              <FaMinus />
                            </button>
                          </div>
                        </div>
                      )}

                      <div
                        className={`border-l-4 pl-2 flex justify-between items-center item__usr__hsb ${
                          user.isBlocked ? "border-red-500" : "border-green-500"
                        }`}
                      >
                        <span
                          className={`mr-3 ${
                            user.isBlocked ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {user.isBlocked ? t("blocked") : t("noBlocking")}
                        </span>
                        <p>
                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.id)}
                              className="flex items-center text-lg bg-green p-1 px-2 rounded-md bg-green-500"
                            >
                              <FaUnlock />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.id)}
                              className="flex items-center text-lg bg-green p-1 px-2 rounded-md bg-red-500"
                            >
                              <FaLock />
                            </button>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <p className="text-center">{t("usersNotFound")}</p>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <button
                className="px-3 py-1 rounded  disabled:opacity-50"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <IoIosArrowBack />
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 border rounded ${
                    currentPage === index + 1
                      ? "bg-orange font-bold border-transparent"
                      : "border-white/20"
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className="px-3 py-1 rounded disabled:opacity-50"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <IoIosArrowForward />
              </button>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-center mb-5 text-2xl">{t("stores")}</h1>

          {(user?.role === "SUPERADMIN" || user?.role === "ADMIN") && (
            <div className="w-full flex justify-end mb-5 store__btn__wrapper">
              <button
                className="bg-greenCs py-2 px-4 rounded-md cursor-pointer"
                onClick={handleCreateShop}
              >
                {t("createShop")}
              </button>
            </div>
          )}

          {shop && (
            <div className="flex w-full justify-end mb-4 created__ad__user__wrapper">
              <div className="flex gap-2 created__ad__user">
                <p className="flex items-center gap-3">
                  <span
                    className="bg-orange py-2 px-4 rounded-md border border-transparent cursor-pointer"
                    onClick={() => handleCopy(shop?.username)}
                  >
                    LOGIN:
                  </span>
                  <span className="py-2 px-4 border border-white/20 rounded-md">
                    {shop?.username}
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <span
                    className="bg-orange py-2 px-4 rounded-md border border-transparent cursor-pointer"
                    onClick={() => handleCopy(shop?.password)}
                  >
                    PASSWORD:
                  </span>
                  <span className="py-2 px-4 border border-white/20 rounded-md">
                    {shop?.password}
                  </span>
                </p>
              </div>
            </div>
          )}

          {displayedStores && (
            <ul className="grid grid-cols-3 gap-5 stores__wrapper">
              {displayedStores.map((store) => (
                <li
                  key={store.id}
                  className="border border-white/40 px-5 py-3 rounded-md flex flex-col gap-2"
                >
                  <div className="border-l-4 border-orange pl-2 flex justify-between gap-3 item__usr__hsb">
                    <span className="text-orange">{t("panelStore")}:</span>
                    <p className="truncate" title={store.name}>
                      {store.name || "Не задано"}
                    </p>
                  </div>

                  <div className="border-l-4 border-orange pl-2 flex justify-between item__usr__hsb">
                    <span className="text-orange">{t("createdAt")}:</span>
                    <p
                      className="truncate"
                      title={new Date(store.createdAt).toLocaleString()}
                    >
                      {new Date(store.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 justify-between border-l-4 border-orange pl-2">
                    <p className="text-orange">{t("visibility")}: </p>
                    <span
                      className={`border border-white/30 w-[50px] h-full rounded-full relative cursor-pointer transition-colors ${
                        store.isVisible ? "bg-green-600" : "bg-darkness"
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

                  {user?.role === "SUPERADMIN" && (
                    <button
                      className="bg-red-500/70 rounded-md py-2 px-4 mt-1 transition-colors hover:bg-red-500"
                      onClick={() => handleDeleteStore(store.id)}
                    >
                      {t("deleteStore")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {totalStorePages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <button
                className="px-3 py-1 rounded disabled:opacity-50"
                onClick={() => handleStorePageChange(currentStorePage - 1)}
                disabled={currentStorePage === 1}
              >
                <IoIosArrowBack />
              </button>
              {[...Array(totalStorePages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 border rounded ${
                    currentStorePage === index + 1
                      ? "bg-orange font-bold border-transparent"
                      : "border-white/20"
                  }`}
                  onClick={() => handleStorePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className="px-3 py-1 rounded disabled:opacity-50"
                onClick={() => handleStorePageChange(currentStorePage + 1)}
                disabled={currentStorePage === totalStorePages}
              >
                <IoIosArrowForward />
              </button>
            </div>
          )}
        </div>

        {user?.role === "SUPERADMIN" && (
          <div>
            <h1 className="text-center mb-5 text-2xl">
              {t("panelCategories")}
            </h1>

            <div className="flex gap-3 items-center w-full justify-center mb-4">
              <input
                type="text"
                placeholder={t("name")}
                className="bg-transparent border border-orange/50 py-2 px-4 rounded-md outline-none focus:border-orange transition-colors"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <button
                className="bg-orange py-2 px-4 rounded-md border border-transparent transition-opacity hover:opacity-[0.6]"
                onClick={handleCreateCategory}
              >
                {t("add")}
              </button>
            </div>

            {displayedCategories && displayedCategories?.length > 0 ? (
              <ul className="grid grid-cols-3 gap-x-4 gap-y-10 ctg__ad__wrapper">
                {displayedCategories.map((category) => {
                  return (
                    <li key={category.id}>
                      <h2 className="bg-darkness rounded-t-md flex justify-between items-center">
                        <span className="py-2 px-3">{category.name}</span>
                        <div
                          className="bg-red-500 px-3 h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-[0.6] aspect-square"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <FaTrashCan className="text-xl" />
                        </div>
                      </h2>

                      <ul>
                        <li className="flex justify-between border border-orange focus:border-orange transition-colors">
                          <input
                            type="text"
                            className="w-full bg-transparent outline-none py-2 px-3"
                            placeholder={t("name")}
                            value={subCategoryNames[category.id] || ""}
                            onChange={(e) =>
                              setSubCategoryNames((prev) => ({
                                ...prev,
                                [category.id]: e.target.value,
                              }))
                            }
                          />
                          <div
                            className="bg-green-500 px-3 h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-[0.6] aspect-square"
                            onClick={() => handleCreateSub(category.id)}
                          >
                            <TiTick className="text-xl" />
                          </div>
                        </li>
                        <ul className="max-h-[227px] overflow-y-scroll">
                          {category.subcategories.map((sub) => {
                            return (
                              <li
                                className="flex border border-orange border-t-0"
                                key={sub.id}
                              >
                                <span className="w-full py-2 px-3">
                                  {sub.name}
                                </span>
                                <div
                                  className="bg-red-500 px-3 h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-[0.6] aspect-square"
                                  onClick={() => handleDeleteSub(sub.id)}
                                >
                                  <FaTrashCan className="text-xl" />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </ul>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <h2 className="text-center text-lg">{t("absent")}</h2>
            )}

            {totalCategoriesPages > 1 && (
              <div className="flex justify-center gap-2 mt-5">
                <button
                  className="px-3 py-1 rounded disabled:opacity-50"
                  onClick={() =>
                    handleCategoriesPageChange(currentCategoryPage - 1)
                  }
                  disabled={currentCategoryPage === 1}
                >
                  <IoIosArrowBack />
                </button>
                {[...Array(totalCategoriesPages)].map((_, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 border rounded ${
                      currentCategoryPage === index + 1
                        ? "bg-orange font-bold border-transparent"
                        : "border-white/20"
                    }`}
                    onClick={() => handleCategoriesPageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded disabled:opacity-50"
                  onClick={() =>
                    handleCategoriesPageChange(currentCategoryPage + 1)
                  }
                  disabled={currentCategoryPage === totalCategoriesPages}
                >
                  <IoIosArrowForward />
                </button>
              </div>
            )}
          </div>
        )}

        {user?.role === "SUPERADMIN" && (
          <div>
            <h1 className="text-center mb-5 text-2xl">{t("images")}</h1>

            <div className="w-full grid grid-cols-2 gap-5 images__wrapper">
              <div>
                <h2 className="text-center mb-5">{t("panelFilters")}</h2>
                {labeled && (
                  <ul className="border border-orange p-3 rounded-md grid grid-cols-3 gap-10 overflow-y-scroll max-h-[410px]">
                    <li
                      className="w-full aspect-square object-cover rounded-full transition-colors cursor-pointer bg-orange/50 hover:bg-orange flex items-center justify-center"
                      onClick={() =>
                        document.getElementById("filter-image-input").click()
                      }
                    >
                      <FaPlus className="text-[#202020] text-4xl" />
                      <input
                        type="file"
                        id="filter-image-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddFilterImage}
                      />
                    </li>
                    {labeled.map((image) => (
                      <li key={image.id}>
                        <img
                          key={image.imageUrl}
                          className="w-full aspect-square object-cover rounded-full transition-colors border-2 border-transparent hover:border-red-500 cursor-pointer"
                          src={URL + image.imageUrl}
                          alt=""
                          onClick={() => handleDeleteLabeled(image.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-center mb-5">{t("panelCarousel")}</h2>

                <div className="grid gap-1 mb-5">
                  <input
                    type="text"
                    placeholder={t("text")}
                    className="bg-transparent border border-orange/50 py-2 px-4 rounded-md outline-none focus:border-orange transition-colors"
                    value={overviewName}
                    onChange={(e) => setOverviewName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    className="bg-transparent border border-orange/50 py-2 px-4 rounded-md outline-none focus:border-orange transition-colors"
                    value={overviewUrl}
                    onChange={(e) => setOverviewUrl(e.target.value)}
                  />

                  <input
                    type="file"
                    id="overviewImageInput"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <button
                    className="bg-greenCs py-2 px-4 rounded-md border border-transparent transition-opacity hover:opacity-[0.6]"
                    onClick={() =>
                      document.getElementById("overviewImageInput").click()
                    }
                  >
                    {t("panelSelectImage")}
                  </button>

                  <button
                    className="bg-orange py-2 px-4 rounded-md border border-transparent transition-opacity hover:opacity-[0.6]"
                    onClick={handleAddOverviewImage}
                  >
                    {t("add")}
                  </button>
                </div>

                {overview && overview.length > 0 ? (
                  <ul className="border border-orange p-3 rounded-md grid grid-cols-3 gap-3 overflow-y-scroll max-h-[410px]">
                    {overview.map((image) => (
                      <li
                        key={image.id}
                        className="w-full aspect-[16/9] overflow-hidden transition-colors border-2 border-transparent hover:border-red-500 cursor-pointer"
                        onClick={() => handleDeleteOverview(image.id)}
                      >
                        <img
                          className="w-full h-full object-cover"
                          src={URL + image.imagePath}
                          alt=""
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <h2 className="text-center">{t("noImagesAvailable")}</h2>
                )}
              </div>
            </div>
          </div>
        )}

        {user?.role === "SUPERADMIN" && (
          <div>
            <h1 className="text-center mb-5 text-2xl">{t("headerButtons")}</h1>
            <div className="grid grid-cols-3 gap-5">
              {headerButtons.map((button) => (
                <div key={button.id} className="border border-white/40 px-5 py-3 rounded-md flex flex-col gap-2">
                  <div className="border-l-4 border-orange pl-2 flex justify-between gap-3">
                    <span className="text-orange">{t("name")}:</span>
                    <input
                      type="text"
                      className="bg-transparent border border-orange/50 py-1 px-2 rounded-md outline-none focus:border-orange transition-colors"
                      value={button.name}
                      onChange={(e) => handleUpdateHeaderButton(button.id, { ...button, name: e.target.value })}
                    />
                  </div>
                  <div className="border-l-4 border-orange pl-2 flex justify-between gap-3">
                    <span className="text-orange">{t("link")}:</span>
                    <input
                      type="text"
                      className="bg-transparent border border-orange/50 py-1 px-2 rounded-md outline-none focus:border-orange transition-colors"
                      value={button.link}
                      onChange={(e) => handleUpdateHeaderButton(button.id, { ...button, link: e.target.value })}
                    />
                  </div>
                  <div className="border-l-4 border-orange pl-2 flex justify-between gap-3">
                    <span className="text-orange">{t("icon")}:</span>
                    <input
                      type="text"
                      className="bg-transparent border border-orange/50 py-1 px-2 rounded-md outline-none focus:border-orange transition-colors"
                      value={button.icon}
                      onChange={(e) => handleUpdateHeaderButton(button.id, { ...button, icon: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {chats && user?.role === "SUPERADMIN" && (
          <div>
            <h1 className="text-center mb-5 text-2xl">{t("chats")}</h1>

            <div className="flex gap-10 items-start chats__wrapper__pgs">
              <div className="w-full">
                <ul className="grid grid-cols-1 w-full gap-3">
                  {visibleChats.map((chat) => (
                    <li
                      key={chat.id}
                      className="w-full border border-white/40 px-5 py-3 rounded-md flex flex-col gap-2"
                    >
                      <div className="flex pl-2 border-l-4 border-orange justify-between">
                        <span className="text-orange">{t("product")}:</span>{" "}
                        <span>{chat?.product?.name}</span>
                      </div>
                      <div className="flex pl-2 border-l-4 border-orange justify-between chat__members">
                        <h3 className="text-orange">{t("members")}:</h3>
                        <ul className="flex justify-between truncate gap-5">
                          {chat.users?.map((user, i) => (
                            <li className="truncate text-green-500" key={i}>
                              {user?.username}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <button
                          className="bg-red-500/70 rounded-md py-2 px-4 mt-1 transition-opacity hover:opacity-[0.6] w-full"
                          onClick={() => handleDeleteChat(chat.id)}
                        >
                          {t("deleteChat")}
                        </button>
                        <button
                          className="bg-orange rounded-md py-2 px-4 mt-1 transition-opacity hover:opacity-[0.6] w-full"
                          onClick={() => handleChatConnect(chat.id, chat.users)}
                        >
                          {t("join")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {totalChatsPages > 1 && (
                  <div className="flex justify-center gap-2 mt-5">
                    <button
                      className="px-3 py-1 rounded disabled:opacity-50"
                      onClick={() =>
                        handleChatsPageChange(chatsCurrentPage - 1)
                      }
                      disabled={chatsCurrentPage === 1}
                    >
                      <IoIosArrowBack />
                    </button>
                    {[...Array(totalChatsPages)].map((_, index) => (
                      <button
                        key={index}
                        className={`px-3 py-1 border rounded ${
                          chatsCurrentPage === index + 1
                            ? "bg-orange font-bold border-transparent"
                            : "border-white/20"
                        }`}
                        onClick={() => handleChatsPageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      className="px-3 py-1 rounded disabled:opacity-50"
                      onClick={() =>
                        handleChatsPageChange(chatsCurrentPage + 1)
                      }
                      disabled={chatsCurrentPage === totalChatsPages}
                    >
                      <IoIosArrowForward />
                    </button>
                  </div>
                )}
              </div>

              <div className="max-w-[350px] w-full bg-[#4d4d4d] rounded-[20px] chat__store">
                <p className="bg-orange py-5 rounded-[20px] px-4 text-center truncate">
                  {currentChatUser || t("chat")}
                </p>

                <ul className="h-[400px] overflow-y-scroll px-4 flex flex-col gap-2 py-2">
                  {messages.map((msg) => (
                    <li
                      key={msg.id}
                      className={`p-2 max-w-[80%] w-full rounded-[20px] px-4 ${
                        msg.role === "SUPERADMIN"
                          ? "bg-[#eb9d37] self-end text-right"
                          : "bg-[#333] self-start text-left"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      {msg.role !== "SUPERADMIN" && (
                        <p className="text-xs text-gray-400 text-right mt-1">
                          {roleLabels[msg.role]}
                        </p>
                      )}
                    </li>
                  ))}
                  <div ref={messagesEndRef}></div>
                </ul>

                <div className="bg-[#1a1a1a] py-7 px-4 rounded-b-[20px] flex items-center gap-3 relative">
                  <FaSmile
                    className="max-w-[50px] text-4xl cursor-pointer"
                    onClick={toggleEmojiPicker}
                  />

                  {isEmojiPickerVisible && (
                    <div className="absolute bottom-full left-0 rounded-md z-10">
                      <EmojiPicker
                        onEmojiClick={(emoji) => addEmojiToMessage(emoji.emoji)}
                        disablePreview={true}
                        disableCategorySelection={true}
                        emojiSize={24}
                        theme="dark"
                        width="300px"
                        height="400px"
                        native={true}
                        lazyLoadEmojis={true}
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    className="bg-[#b3b3b3] w-full py-2 outline-none rounded-[20px] px-4 text-[#1a1a1a]"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <SiTelegram
                    className="max-w-[50px] text-4xl cursor-pointer"
                    onClick={sendMessage}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showBalanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-[#333] p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-center">
                {balanceOperation === 'add' ? t("addBalance") : t("subtractBalance")}
              </h2>
              
              <div className="mb-4">
                <label className="block mb-2">{t("amount")} (KZT):</label>
                <input
                  type="text"
                  className="w-full p-2 bg-[#222] border border-orange rounded focus:outline-none focus:ring-2 focus:ring-orange"
                  value={balanceAmount}
                  onChange={handleBalanceAmountChange}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition"
                  onClick={() => setShowBalanceModal(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  className={`px-4 py-2 rounded transition ${
                    balanceOperation === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleBalanceUpdate}
                  disabled={!balanceAmount || parseFloat(balanceAmount) <= 0}
                >
                  {balanceOperation === 'add' ? t("add") : t("subtract")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPanel;
