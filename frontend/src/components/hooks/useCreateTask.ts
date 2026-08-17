import {useState,useCallback} from 'react';
import { ITask, INft } from "../types/global_types"
import { IProject } from './useCreateProject';

const useCreateTask = (date:Date) => {
    const [data,setData] = useState<ITask>({
        name:'',date:date,time:'',link:'',
        type:'default',points:0,description:'',smallDescription:'',
        v2ActivityId:'',activityEntity:'fomo_v2',accessTier:'public',
        scope:'global',origin:'admin'
    })

    const inputsHandler = useCallback((value:string | File | IProject | INft,inputName?:string) => {
        if(inputName){
            setData({...data,[inputName]:value})
        }
    },[data])

    return {data,inputsHandler} 
}

export default useCreateTask
