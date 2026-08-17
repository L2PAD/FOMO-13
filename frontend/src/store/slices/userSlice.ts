import { createSlice } from '@reduxjs/toolkit'
import sortByDate from '../../components/utils/sortByDate'
import { IFilterOptions } from '../../components/common/filterUser'

const filter = (items: Array<any>,options:IFilterOptions) : any => {
  return items.filter((item : any) => {
    return (
      Number(item.points) >= options.points.from 
      && 
      Number(item.points) <= options.points.to
    )
  })
}

const search = (items:Array<any>,value:string) : any => {
  return items.filter((item:any) => item.username?.toLowerCase().includes(value?.toLowerCase()))
}

const sort = (items:Array<any>,options:any) : any => {
  if(options.type === 'a'){
    return items.sort((a:any,b:any) => {
      if(a.username?.toLowerCase() < b.username?.toLowerCase()){
        return -1
      }else{
        return 1
      } 
    })
  }
  
  if(options.type === 'z'){
    return items.sort((a:any,b:any) => {
      if(a.username?.toLowerCase() > b.username?.toLowerCase()){
        return -1
      }else{
        return 1
      }
    })
  }
  if(options.type === 'new'){
    return sortByDate(items)
  }
  if(options.type === 'old'){
    return sortByDate(items,'end')
  }
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    selectedUsers: [],
    items:[],
    allItems:[],
    filterOptions:{points:{from:0,to:100000},status:{active:true,banned:true}},
    sortOptions:{type:'a'},
    searchValue:''
  },
  reducers: {
    setSelectedUsers(state,action){
        state.selectedUsers = action.payload
    },
    setItems(state,action){
      state.items = action.payload
      state.allItems = action.payload
    },
    searchByName(state,action){
      const searchValue : string = action.payload.searchValue 

      state.searchValue = searchValue

      if(!searchValue){
        state.items = state.allItems

        return 
      }

      const items = sort(search(filter(state.allItems,state.filterOptions),searchValue),state.sortOptions)

      state.items = items
    },
    filterItems(state,action){
      const filterOptions = action.payload

      state.filterOptions = filterOptions
      
      const items = sort(search(filter(state.allItems,filterOptions),state.searchValue),state.sortOptions)

      state.items = items
    },
    sortItems(state,action){
      const sortOptions = action.payload

      state.sortOptions = sortOptions

      const items = sort(search(filter(state.allItems,state.filterOptions),state.searchValue),sortOptions)

      state.items = items
    }
  },
})

export const { setSelectedUsers, setItems, searchByName, filterItems, sortItems} = userSlice.actions

export default userSlice.reducer
