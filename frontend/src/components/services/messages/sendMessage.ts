import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (data:any) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`messages`),{
            method:'POST',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify(data),
            credentials:'include'
        });

        const message = await responce.json()

        return {success:true,data:message}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}