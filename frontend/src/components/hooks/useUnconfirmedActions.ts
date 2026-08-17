import { useEffect,useState } from "react"
import { fetchData } from "./useFetch"
import getAccessToken from "../utils/getAccessToken"
import { useSelector } from "react-redux"
import sortByDate from "../utils/sortByDate"

export const options = {
    method:'GET',
    headers:{
        'Authorization':`Bearer ${getAccessToken()}`
    }
}

const useUnconfirmedActions = () => {
    const [loading,setLoading] = useState(false)
    const [actionsData,setActionsData] = useState<Array<any>>([])

    const getActionsData = async () => {
        try{
            const role : string | null = localStorage.getItem('fomoRole')

            setLoading(true)

            const {data} = await fetchData(`actions/${role}`,options)

            setActionsData(data)

            setLoading(false)
        }catch(error){
            console.log(error)
            setLoading(false)
        }
    }
    
    useEffect(() => {
        getActionsData()
    },[])

    return {actionsData,loading}
}

export default useUnconfirmedActions