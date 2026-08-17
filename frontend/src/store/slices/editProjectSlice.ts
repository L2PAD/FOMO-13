import { createSlice } from '@reduxjs/toolkit'
import { IProject } from '../../components/hooks/useCreateProject';

export const editProjectSlice = createSlice({
  name: 'editProject',
  initialState: {
    project:{},
  },
  reducers: {
    setProject(state,action){
        const investors = action.payload.investors
        state.project = {...action.payload,investors}
    },
    editProject(state,action){
        const key = action.payload.key
        const value = action.payload.value
        state.project = {...state.project,[key] : value}  
    },
    updateProjectByKeys(state,action){
      for (const key in action.payload) {
        const value : any = action.payload[key]
        //@ts-ignore
        state.project[key] = value
      }
    }
  },
})


export const {setProject,editProject,updateProjectByKeys} = editProjectSlice.actions
export default editProjectSlice.reducer
