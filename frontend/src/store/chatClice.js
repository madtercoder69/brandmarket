import { createSlice } from "@reduxjs/toolkit";

const getSavedChatState = () => {
  try {
    const savedChat = localStorage.getItem('currentChat');
    return savedChat ? JSON.parse(savedChat) : { type: "GENERAL", isOpen: false, productId: null };
  } catch (error) {
    console.error('Error reading chat state from localStorage:', error);
    return { type: "GENERAL", isOpen: false, productId: null };
  }
};

const initialState = {
  chatHistory: [],
  currentChat: getSavedChatState(),
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChat: (state, action) => {
      state.currentChat = { ...state.currentChat, ...action.payload };
      try {
        localStorage.setItem('currentChat', JSON.stringify(state.currentChat));
      } catch (error) {
        console.error('Error saving chat state to localStorage:', error);
      }
    },
    resetChat: (state) => {
      state.currentChat = { type: "GENERAL", isOpen: false, productId: null };
      try {
        localStorage.setItem('currentChat', JSON.stringify(state.currentChat));
      } catch (error) {
        console.error('Error saving chat state to localStorage:', error);
      }
    },
  },
});

export const { setChat, resetChat } = chatSlice.actions;
export default chatSlice.reducer;
