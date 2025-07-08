import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchLabeled = createAsyncThunk(
  "lebeled/fetchLebeled",
  async () => {
    try {
      const response = await axiosInstance.get("/filters");
      const data = response.data;
      return data;
    } catch (err) {
      console.log(err.response);
      throw err;
    }
  }
);

const labeledSlice = createSlice({
  name: "labeled",
  initialState: {
    labeled: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabeled.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLabeled.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.labeled = action.payload;
        state.error = null;
      })
      .addCase(fetchLabeled.rejected, (state, action) => {
        state.status = "failed";
        state.labeled = null;
        state.error = action.error.message;
      });
  },
});

export default labeledSlice.reducer;
