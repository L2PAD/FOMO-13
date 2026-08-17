import {useState,useCallback} from 'react';
import { IEvent, INft } from "../types/global_types"
import { IProject } from './useCreateProject';

const useCreateEvents = (date:Date) => {
    const [data,setData] = useState<IEvent>({name:'',date:date,stars:0,time:'',projectId:''})

    const inputsHandler = useCallback((value:string | File | IProject | INft,inputName?:string) => {
        if(inputName){
            setData({...data,[inputName]:value})
        }
    },[data])

    return {data,inputsHandler}
}

export default useCreateEvents