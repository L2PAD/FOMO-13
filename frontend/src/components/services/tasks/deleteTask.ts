import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (id:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`tasks/${id}`),{
            method:'DELETE',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });


        return {success:responce.status < 300,data:'Task deleted'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}