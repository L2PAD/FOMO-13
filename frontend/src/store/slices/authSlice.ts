import { createSlice } from '@reduxjs/toolkit'

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuth: false,
    role:null
  },
  reducers: {
    setAuth(state,action){
        state.isAuth = action.payload
    },
    setRole(state,action){
      state.role = action.payload
    }
  },
})

export const { setAuth , setRole} = authSlice.actions

export default authSlice.reducer
