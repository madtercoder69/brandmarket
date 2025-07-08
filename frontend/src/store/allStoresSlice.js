import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchAllStores = createAsyncThunk(
  "store/fetchAllStores",
  async () => {
    try {
      const response = await axiosInstance.get("/admin/stores");
      const data = response.data;
      return data;
    } catch (err) {
      console.log(err.response);
      throw err;
    }
  }
);

const allStoresSlice = createSlice({
  name: "allStores",
  initialState: {
    allStores: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStores.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllStores.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allStores = action.payload;
        state.error = null;
      })
      .addCase(fetchAllStores.rejected, (state, action) => {
        state.status = "failed";
        state.allStores = null;
        state.error = action.error.message;
      });
  },
});

export default allStoresSlice.reducer;
