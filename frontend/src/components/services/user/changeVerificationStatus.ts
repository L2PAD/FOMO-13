import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (userId:string,status:'verification' | 'remove-verification') : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`user/verification/${userId}/${status}`),{
            method:'PATCH',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });

        const data = await responce.json()

        return {success:true,data}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}