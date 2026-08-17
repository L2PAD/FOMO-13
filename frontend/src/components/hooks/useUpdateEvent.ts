import {useState,useCallback} from 'react';
import { IEvent, INft } from "../types/global_types"
import { IProject } from './useCreateProject';

const useUpdateEvent = (event:IEvent) => {
    const [data,setData] = useState<IEvent>(event)

    const inputsHandler = useCallback((value:string | File | IProject | INft,inputName?:string) => {
        if(inputName){
            setData({...data,[inputName]:value})
        }
    },[data])

    return {data,inputsHandler}
}

export default useUpdateEvent