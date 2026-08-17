import { useState ,useCallback,useEffect} from "react"
import { useDispatch,useSelector } from "react-redux"
import { configureUrl } from "../services/config"
import { IReturnData } from "../services/types"

const useFetch = (path:string,options?:object,isNotImmidiatly?:boolean) => {
    const [loading,setLoading] = useState(false)
    const [data,setData] = useState<IReturnData | undefined>()

    const dataHandler = async () => {
        setLoading(true)

        const responce = await fetchData(path,options)

        if(!responce.success){
            setData(responce)
            setLoading(false)
            return responce
        }

        setData(responce)

        setLoading(false)
        return responce
    }

    const updateFetchData = (updatedData:any) => {
        setData({success:true,data:updatedData || {}})
    }

    useEffect(():void => {
        if(!isNotImmidiatly){
            dataHandler()
        }
    },[])

    return {data,loading,dataHandler,updateFetchData}
}

export const fetchData = async (path:string,options?:object) => {
    try{
        const responce = await fetch(configureUrl(path),{...options,credentials:'include'})
        
        const text = await responce.text()
        const data = text ? JSON.parse(text) : {}

        return {success:responce.ok && !data?.message,data}
    }catch(error){
        console.log(error)
        return {success:false,data:{}}
    }
}

export default useFetch
