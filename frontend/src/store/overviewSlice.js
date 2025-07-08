import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchOverview = createAsyncThunk(
  "overview/fetchOverview",
  async () => {
    try {
      const response = await axiosInstance.get("/overview");
      const data = response.data;
      return data;
    } catch (err) {
      console.log(err.response);
      throw err;
    }
  }
);

const overviewSlice = createSlice({
  name: "overview",
  initialState: {
    overview: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.overview = action.payload;
        state.error = null;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.status = "failed";
        state.overview = null;
        state.error = action.error.message;
      });
  },
});

export default overviewSlice.reducer;
