import { useState ,useCallback} from "react";
import { INews } from "../types/global_types";
import RecommendationsModal from '../layouts/news_layout/modals/recommendations_modal/RecommendationsModal';

export interface ICreateNews {
    title:string
    date:Date
    type:string
    text:string
    image?:File
    recommendations?:Array<string>
    RecommendationNewsItems?:Array<INews>
}

const useCreateNews = () => {
    const [data,setData] = useState<ICreateNews>({title:'',date: new Date(),type:'',text:''})

    const inputsHandler = useCallback((value:string | File | Array<string>,inputName?:string) => {
        if(inputName){
            setData({...data,[inputName]:value})
        }
    },[data])

    return {data,inputsHandler}
}

export default useCreateNews