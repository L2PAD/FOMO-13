import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/countSlice'
import authSlice from './slices/authSlice'
import projectSlice from './slices/projectSlice'
import editProjectSlice from './slices/editProjectSlice'
import userSlice from './slices/userSlice'
import confirmSlice from './slices/confirmSlice'
import searchSlice from './slices/searchSlice'
import searchMessagesSlice from './slices/searchMessagesSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth:authSlice,
    project:projectSlice,
    editProject:editProjectSlice,
    user:userSlice,
    confirm:confirmSlice,
    search:searchSlice,
    searchMessages:searchMessagesSlice
  },
  middleware: getDefaultMiddleware =>
  getDefaultMiddleware({
    serializableCheck: false,
  }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
