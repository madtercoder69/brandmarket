import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchCategories = createAsyncThunk(
  "store/fetchCategories",
  async () => {
    try {
      const response = await axiosInstance.get("/category");
      const data = response.data;
      return data;
    } catch (err) {
      console.log(err.response);
      throw err;
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.categories = null;
        state.error = action.error.message;
      });
  },
});

export default categoriesSlice.reducer;
