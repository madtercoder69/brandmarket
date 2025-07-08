import { useDispatch, useSelector } from "react-redux";
import StoreHeader from "../components/StoreHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FaSmile } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";
import EmojiPicker from "emoji-picker-react";
import { io } from "socket.io-client";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { toast } from "react-sonner";
import { fetchUser } from "../store/userSlice";
import axiosInstance from "../utils/axiosInstance";

const StoreChats = ({ t }) => {
  const URL = import.meta.env.VITE_BACKEND_URL;

  const roleLabels = {
    SUPERADMIN: t("admin"),
    ADMIN: t("admin"),
    STORE_OWNER: t("store"),
    USER: t("user"),
  };

  const user = useSelector((state) => state.user.user);
  const status = useSelector((state) => state.user.status);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [chatsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(0);

  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);

  const currentChats = user?.chats?.slice(
    (currentPage - 1) * chatsPerPage,
    currentPage * chatsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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

      const chatUser = chatUsers.find((u) => u.role !== "STORE_OWNER");
      setCurrentChatUser(chatUser ? chatUser.username : t("unknown"));
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

  const handleDeleteChat = async (chatId) => {
    try {
      await axiosInstance.delete(`/chat/${chatId}`);
      dispatch(fetchUser());
      toast.success(t("chatDeleted"));
    } catch (err) {
      toast.error(t("error"));
      console.log(err);
    }
  };

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

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (status === "succeeded") {
      if (!user || user.role !== "STORE_OWNER") {
        navigate("/", { replace: true });
      } else {
        setTotalPages(Math.ceil(user?.chats?.length / chatsPerPage));
      }
    }
  }, [user, status, navigate]);

  if (status === "loading" || !user || user.role !== "STORE_OWNER") {
    return null;
  }

  return (
    <section className="content__wrapper content__wrapper__own">
      <div className="content">
        <StoreHeader t={t} />

        <div className="w-full flex justify-end gap-14 items-start chats__wrapper">
          <div className="flex flex-col w-full">
            <ul className="w-full grid grid-cols-2 gap-3 chats__wrapper__store">
              {currentChats?.map((chat) =>
                chat.users?.map((user) =>
                  user.role !== "STORE_OWNER" ? (
                    <li
                      key={chat.id}
                      className="flex items-center gap-2 w-full flex-col"
                    >
                      <div className="bg-[#333333] py-4 rounded-md w-full px-4 text-start truncate flex gap-2 flex-col">
                        <p className="border-l-4 pl-2 border-orange">
                          <span className="text-orange">{t("username")}:</span>{" "}
                          {user?.username}
                        </p>
                        <p className="border-l-4 pl-2 border-orange">
                          <span className="text-orange">{t("product")}:</span>{" "}
                          {chat?.product?.name}
                        </p>
                        <p className="border-l-4 pl-2 border-orange">
                          <span className="text-orange">
                            {t("productPrice")}:
                          </span>{" "}
                          {chat?.product?.price}
                        </p>
                        <p className="border-l-4 pl-2 border-orange">
                          <span className="text-orange">{t("quantity")}:</span>{" "}
                          {chat?.product?.quantity}
                        </p>
                      </div>

                      <div className="flex w-full gap-1">
                        <button
                          className="bg-orange py-2 px-4 rounded-md transition-opacity hover:opacity-[0.6] cursor-pointer w-full text-center"
                          onClick={() => handleChatConnect(chat.id, chat.users)}
                        >
                          {t("chat")}
                        </button>
                        <button
                          className="border border-red-500 py-2 px-4 rounded-md transition-colors hover:bg-red-500 cursor-pointer w-full text-center"
                          onClick={() => handleDeleteChat(chat.id)}
                        >
                          {t("delete")}
                        </button>
                      </div>
                    </li>
                  ) : null
                )
              )}
            </ul>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-5">
                <button
                  className="px-3 py-1 rounded disabled:opacity-50"
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

          <div className="max-w-[350px] w-full bg-[#4d4d4d] rounded-[20px] chat__store">
            <p className="bg-orange py-5 rounded-[20px] px-4 text-center truncate">
              {currentChatUser || t("chat")}
            </p>

            <ul className="h-[400px] overflow-y-scroll px-4 flex flex-col gap-2 py-2">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`p-2 max-w-[80%] w-full rounded-[20px] px-4 ${
                    msg.role === "STORE_OWNER"
                      ? "bg-[#eb9d37] self-end text-right"
                      : "bg-[#333] self-start text-left"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  {msg.role !== "STORE_OWNER" && (
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
    </section>
  );
};
export default StoreChats;
