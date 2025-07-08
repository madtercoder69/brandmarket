import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import overviewReducer from "./overviewSlice";
import storeReducer from "./storeSlice";
import categoriesReducer from "./categorySlice";
import usersReducer from "./usersSlice";
import allStoresReducer from "./allStoresSlice";
import labeledReducer from "./labeledSlice";
import chatReducer from "./chatClice";
import chatsReducer from "./chatsClice";

const store = configureStore({
  reducer: {
    user: userReducer,
    users: usersReducer,
    stores: storeReducer,
    overview: overviewReducer,
    categories: categoriesReducer,
    allStores: allStoresReducer,
    labeled: labeledReducer,
    chat: chatReducer,
    chats: chatsReducer,
  },
});

export default store;
