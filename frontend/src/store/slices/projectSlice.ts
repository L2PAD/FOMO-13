import { createSlice } from '@reduxjs/toolkit'

export const projectSlice = createSlice({
  name: 'project',
  initialState: {
    updatedProject: 0,
  },
  reducers: {
    setUpdatedProject(state,action){
        state.updatedProject = action.payload
    },
  },
})


export const {setUpdatedProject} = projectSlice.actions
export default projectSlice.reducer
