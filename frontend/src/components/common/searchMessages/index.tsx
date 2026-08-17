import {useState,useEffect} from 'react'
import { useDispatch } from 'react-redux'
import { searchByName } from '../../../store/slices/searchMessagesSlice'
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
            placeholder='Search by theme'
            className={searchInput}
        />
    </div>
  )
}

export default SearchBar
