import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchChats = createAsyncThunk("chats/fetchChats", async () => {
  try {
    const response = await axiosInstance.get("/admin/chats");
    const data = response.data;
    return data;
  } catch (err) {
    console.log(err.response);
    throw err;
  }
});

const chatsSlice = createSlice({
  name: "chats",
  initialState: {
    chats: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.chats = action.payload;
        state.error = null;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.status = "failed";
        state.chats = null;
        state.error = action.error.message;
      });
  },
});

export default chatsSlice.reducer;
