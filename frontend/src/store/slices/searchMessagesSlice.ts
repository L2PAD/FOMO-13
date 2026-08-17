import { createSlice } from '@reduxjs/toolkit'
import sortByDate from '../../components/utils/sortByDate';

const filter = (items: Array<any>,options:{totalRaised:{from:number,to:number}}) : any => {
  const isProject = !!items[0]?.name

  if(!isProject) return items

  return items.filter((item : any) => {
    return (
      Number(item.totalRaised) >= options.totalRaised.from 
      && 
      Number(item.totalRaised) <= options.totalRaised.to
    )
  })
}

const search = (items:Array<any>,value:string) : any => {
  const isProject = !!items[0]?.name
  const key : string = isProject ? 'name' : 'theme'

  return items.filter((item:any) => item[key].toLowerCase().includes(value.toLowerCase()))
}

const sort = (items:Array<any>,options:any) : any => {
  const isProject = !!items[0]?.name
  const key : string = isProject ? 'lastFunding' : 'date'

  if(options.type === 'a'){
    return items.sort((a:any,b:any) => {
      if(a[key]?.toLowerCase() < b[key]?.toLowerCase()){
        return -1
      }else{
        return 1
      } 
    })
  }
  if(options.type === 'z'){
    return items.sort((a:any,b:any) => {
      if(a[key]?.toLowerCase() > b[key]?.toLowerCase()){
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

export const searchMessagesSlice = createSlice({
  name: 'searchMessages',
  initialState: {
    allItems:[],
    items:[],
    filterOptions:{totalRaised:{from:0,to:1000000}},
    sortOptions:{type:'a'},
    searchValue:''
  },
  reducers: {
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
      
      const items =  sort(search(filter(state.allItems,filterOptions),state.searchValue),state.sortOptions)

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


export const {setItems,searchByName,filterItems,sortItems} = searchMessagesSlice.actions
export default searchMessagesSlice.reducer
