import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';
import { ITask } from "../../types/global_types";

export default async (task:ITask,action:string,userId:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`tasks/request/${action}/${userId}/${task._id}/${task.points}`),{
            method:'PUT',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });


        return {success:responce.status < 300,data:'Task updated'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}