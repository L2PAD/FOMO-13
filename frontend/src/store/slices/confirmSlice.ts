import { createSlice } from '@reduxjs/toolkit'
import { IAction } from '../../components/types/global_types'

export const confirmSlice = createSlice({
  name: 'confirm',
  initialState: {
    selected: [],
  },
  reducers: {
    setSelectedActions: (state,action) => {
        state.selected = action.payload
    }
  },
})

export const { setSelectedActions } = confirmSlice.actions

export default confirmSlice.reducer
