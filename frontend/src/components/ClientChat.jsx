import React, { useState, useRef, useEffect } from "react";
import { FaSmile } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";
import EmojiPicker from "emoji-picker-react";
import { useLocation } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import { io } from "socket.io-client";
import { IoTriangleSharp } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import { setChat, resetChat } from "../store/chatClice";

const ClientChat = ({ t }) => {
  const URL = import.meta.env.VITE_BACKEND_URL;
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
  const chat = useSelector((state) => state.chat.currentChat);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const messagesEndRef = useRef(null);

  const roleLabels = {
    SUPERADMIN: t("admin"),
    ADMIN: "Админ",
    STORE_OWNER: t("store"),
    USER: t("user"),
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerVisible(!isEmojiPickerVisible);
  };

  const addEmojiToMessage = (emoji) => {
    setMessageInput(messageInput + emoji);
  };

  const handleOpenSupportChat = (newChat) => {
    dispatch(setChat(newChat));
  };

  const handleOpenGeneralChat = () => {
    dispatch(setChat({ type: "GENERAL", isOpen: true }));
  };

  const handleResetChat = () => {
    dispatch(resetChat());
  };

  const toggleChat = () => {
    dispatch(setChat({ ...chat, isOpen: !chat.isOpen }));
  };

  const sendMessage = () => {
    if (socket && messageInput.trim()) {
      socket.emit("send_message", messageInput);
      setMessageInput("");
    }
  };

  useEffect(() => {
    if (!user) return;
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    if (chat.isOpen) {
      if (chat.type === "SUPPORT" && chat.productId) {
        const accessToken = localStorage.getItem("accessToken");
        const newSocket = io(URL, {
          query: { productId: chat.productId },
          extraHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        newSocket.on("chat_history", (chatHistory) => {
          setMessages(chatHistory);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        newSocket.on("new_message", (message) => {
          setMessages((prev) => [...prev, message]);
        });

        setSocket(newSocket);
      } else if (chat.type === "GENERAL") {
        const accessToken = localStorage.getItem("accessToken");
        const newSocket = io(URL, {
          extraHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        newSocket.on("chat_history", (chatHistory) => {
          setMessages(chatHistory);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        newSocket.on("new_message", (message) => {
          setMessages((prev) => [...prev, message]);
        });

        setSocket(newSocket);
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [chat.type, chat.productId, chat.isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (
    [
      "/signin",
      "/signup",
      "/store-panel",
      "/store-products",
      "/store-chats",
      "/admin",
    ].includes(location.pathname)
  )
    return null;

  if (!user) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 chat ${
        chat.isOpen
          ? "w-[350px] chat__adaptive__active"
          : "w-[100px] chat__adaptive"
      } transition-all`}
    >
      {chat.isOpen && (
        <button
          onClick={toggleChat}
          className="top-2 right-2 bg-[#b3b3b3] p-2 rounded-[20px] w-full rounded-b-none flex items-center justify-center swap__chat"
        >
          <IoIosArrowDown />
        </button>
      )}

      {chat.isOpen ? (
        <div className="bg-[#4d4d4d] rounded-[20px] rounded-t-none chat__wrapper">
          <button
            onClick={toggleChat}
            className=" top-2 right-2 bg-black p-2 rounded-[20px] w-full rounded-b-none items-center justify-center swap__chat__mobile hidden"
          >
            <IoIosArrowDown />
          </button>
          <div className="py-1 rounded-[20px] px-1 text-center truncate flex flex-col gap-1 chat__type__mobile">
            {user.role !== "STORE_OWNER" && (
              <div
                className="bg-orange py-2 rounded-[10px] transition-opacity hover:opacity-[0.7] cursor-pointer"
                onClick={() =>
                  dispatch(setChat({ type: "GENERAL", isOpen: true }))
                }
              >
                {t("general")}
              </div>
            )}

            {user.role !== "STORE_OWNER" && chat.productId && (
              <div
                className="bg-orange py-2 rounded-[10px] transition-opacity hover:opacity-[0.7] cursor-pointer"
                onClick={() =>
                  dispatch(
                    setChat({
                      type: "SUPPORT",
                      isOpen: true,
                      productId: chat.productId,
                    })
                  )
                }
              >
                {t("support")}
              </div>
            )}
          </div>

          <ul className="h-[300px] overflow-y-scroll px-4 flex flex-col gap-2 py-2 chat__content">
            {chat.type === "SUPPORT" && chat.productId ? (
              messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`p-2 max-w-[80%] w-full rounded-[20px] px-4 ${
                    msg.senderId === user.id
                      ? "bg-[#1a1a1a] self-end text-right"
                      : "bg-[#eb9d37] self-start text-left"
                  }`}
                >
                  <div 
                    className="break-words" 
                    dangerouslySetInnerHTML={{ 
                      __html: msg.content.replace(
                        /href="\/files\/products\//g, 
                        `href="${URL}/files/products/`
                      )
                    }}
                  ></div>
                  {msg.senderId !== user.id && (
                    <p className="text-xs text-[#333] text-right mt-1">
                      {roleLabels[msg.role] ?? null}
                    </p>
                  )}
                </li>
              ))
            ) : chat.type === "GENERAL" ? (
              messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`p-2 max-w-[80%] w-full rounded-[20px] px-4 ${
                    msg.senderId === user.id
                      ? "bg-[#1a1a1a] self-end text-right"
                      : "bg-[#eb9d37] self-start text-left"
                  }`}
                >
                  <div 
                    className="break-words" 
                    dangerouslySetInnerHTML={{ 
                      __html: msg.content.replace(
                        /href="\/files\/products\//g, 
                        `href="${URL}/files/products/`
                      )
                    }}
                  ></div>
                  {msg.senderId !== user.id && (
                    <p className="text-xs text-[#333] text-right mt-1">
                      {roleLabels[msg.role] ?? null}
                    </p>
                  )}
                </li>
              ))
            ) : (
              <p className="text-white text-center">Coming soon...</p>
            )}
            <div ref={messagesEndRef} />
          </ul>

          <div className="bg-[#1a1a1a] py-7 px-4 rounded-b-[20px] flex items-center gap-3 relative chat__input__wrapper">
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
                  height="350px"
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
              //placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <SiTelegram 
              className="max-w-[50px] text-4xl cursor-pointer"
              onClick={sendMessage}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={toggleChat}
          className="w-full h-full flex justify-center items-center bg-orange text-white rounded-[20px] px-4 py-4 gap-2 chat__open"
        >
          ЧАТ
          <IoTriangleSharp className="min-w-[0px]" />
        </button>
      )}
    </div>
  );
};

export default ClientChat;
