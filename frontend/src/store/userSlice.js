import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const fetchUser = createAsyncThunk("user/fetchUser", async () => {
  try {
    const response = await axiosInstance.get("/user/me");
    const data = response.data;
    return data;
  } catch (err) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    console.log(err.response);
  }
});

export const logout = createAsyncThunk("user/logout", async () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return;
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
        state.error = null;
      });
  },
});

export default userSlice.reducer;
