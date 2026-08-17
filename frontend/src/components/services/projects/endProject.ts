import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (id:string,isRefund:boolean) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }
        
        const responce = await fetch(configureUrl(`projects/end/${id}/${isRefund ? '1' : '0'}`),{
            method:'PUT',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });

        const error = await responce.text()

        return {success:responce.status < 300,data:error}

    }catch(error){
        console.log(error)

        return {success:false,data:error}
    }
}