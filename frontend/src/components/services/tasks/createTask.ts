import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureFetchForm, configureUrl } from '../config';
import { ITask } from "../../types/global_types";

export default async (data:ITask,type:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const fetchForm : any = configureFetchForm('POST',{...data,type},{'Authorization': `Bearer ${getAccessToken()}`})

        const responce = await fetch(configureUrl(`tasks`),fetchForm);
     
        return {success:responce.status < 300,data:'Task created'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}
























