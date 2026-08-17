import { useState ,useCallback} from "react";
import { INews } from "../types/global_types";

interface ICreateNews {
    title:string
    date:Date
    type:string
    text:string
    image?:File
    recommendations?: Array<string>
}

const useUpdateNews = (news:INews) => {
    const [data,setData] = useState<INews>(news)

    const inputsHandler = useCallback((value:string | File | Array<string>,inputName?:string ) => {
        if(inputName){
            setData({...data,[inputName]:value})
        }
    },[data])

    return {data,inputsHandler}
}

export default useUpdateNews