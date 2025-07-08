import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchStores = createAsyncThunk("store/fetchStores", async () => {
  try {
    const response = await axiosInstance.get("/store");
    const data = response.data;
    return data;
  } catch (err) {
    console.log(err.response);
    throw err;
  }
});

const storeSlice = createSlice({
  name: "store",
  initialState: {
    stores: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stores = action.payload;
        state.error = null;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.status = "failed";
        state.stores = null;
        state.error = action.error.message;
      });
  },
});

export default storeSlice.reducer;
