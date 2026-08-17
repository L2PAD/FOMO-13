import { createSlice } from '@reduxjs/toolkit'
import { IProject } from '../../components/hooks/useCreateProject';
import sortByDate from '../../components/utils/sortByDate';
import { IFilterOptions } from '../../components/common/filter';
import upperCaseFirstLetter from '../../components/utils/upperCaseFirstLetter';
import { ProjectValidationFilters } from '../../components/common/filter/index';

const filter = (items: Array<any>,options:IFilterOptions) : any => {
  const isProject = !!items[0]?.name

  if(!isProject) return items

  return items.filter((item : any) => {
    // const isTotalRaisedInRange = Number(item.totalRaised) >= options.totalRaised.from 
    //                              &&
    //                              Number(item.totalRaised) <= options.totalRaised.to;

    // const isProjectTypeIncluded = options.projectTypes.includes(item.projectType);
      
    const itemValidationStatus : ProjectValidationFilters = upperCaseFirstLetter(item.projectStatus)
    
    const isProjectValidation = options.projectValidation.includes(itemValidationStatus);

    const isFundValid = options.selectedFund === 'ALL' 
      || item.investors.some((fund: any) => fund._id === options.selectedFund._id);

    return isFundValid && isProjectValidation;
  })
}

export const search = (items:Array<any>,value:string) : any => {
  const isProject = !!items[0]?.name
  const key : string = isProject ? 'name' : 'theme'

  return items.filter((item:any) => item[key].toLowerCase().includes(value.toLowerCase()))
}

export const sort = (items:Array<any>,options:any) : any => {
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

export const searchSlice = createSlice({
  name: 'search',
  initialState: {
    allItems:[],
    items:[],
    filterOptions:{
      totalRaised:{from:0,to:1000000},
      projectTypes:[],
      projectValidation:[],
      selectedFund:'ALL'
    },
    sortOptions:{type:'a'},
    searchValue:''
  },
  reducers: {
    setItems(state,action){
      state.items = action.payload
      state.allItems = action.payload
    },
    searchByName(state,action){
      state.searchValue = action.payload.searchValue
      // const searchValue : string = action.payload.searchValue 

      // state.searchValue = searchValue

      // if(!searchValue){
      //   state.items = state.allItems

      //   return 
      // }

      // const items = sort(search(filter(state.allItems,state.filterOptions),searchValue),state.sortOptions)

      // state.items = items
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


export const {setItems,searchByName,filterItems,sortItems} = searchSlice.actions
export default searchSlice.reducer
