import {useState,useCallback} from 'react';
import { ITask, INft } from "../types/global_types"
import { IProject } from './useCreateProject';

const useUpdateTask = (event:ITask) => {
    const [data,setData] = useState<ITask>({
        name: event.name || '',
        date: event.date,
        time: event.time || '',
        link: event.link || '',
        description: event.description || '',
        smallDescription: event.smallDescription || '',
        type: event.type,
        points: Number(event.points || 0),
        goal: Number(event.goal || 0),
        status: event.status,
        validationKey: event.validationKey,
        v2ActivityId: event.v2ActivityId || '',
        activityEntity: event.v2ActivityId ? 'fomo_v2' : undefined,
        accessTier: event.accessTier || 'public',
        scope: 'global',
        origin: 'admin',
    })

    const inputsHandler = useCallback((value:string | File | IProject | INft,inputName?:string) => {
        if(inputName){
            setData({...data,[inputName]:value})
        }
    },[data])

    return {data,inputsHandler}
}

export default useUpdateTask
