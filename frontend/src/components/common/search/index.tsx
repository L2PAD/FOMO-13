import {useState,useEffect} from 'react'
import { useDispatch } from 'react-redux'
import { searchByName } from '../../../store/slices/searchSlice'
import SearchIcon from '../Icons/search_icon'
import { useStyles } from './styles'

const SearchBar = () => {
    const dispatch = useDispatch()
    const [searchValue,setSearchValue] = useState<string>('')
    const {searchWrapper,searchInput} = useStyles()

    useEffect(() => {
        dispatch(searchByName({searchValue}))
    },[searchValue])

  return (
    <div className={searchWrapper}>
        <SearchIcon />
        <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            type="text"
            placeholder='Search'
            className={searchInput}
        />
    </div>
  )
}

export default SearchBar
