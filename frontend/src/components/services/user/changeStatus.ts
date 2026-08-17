import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (path:string,id:string,status:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`${path}/${id}/${status}`),{
            method:'PUT',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });

        return {success:true,data:'User status changed'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}