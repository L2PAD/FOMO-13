import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (options:any) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`user?banned=${options.status.banned ? '1' : '0'}&active=${options.status.active ? '1' : '0'}`),{
            method:'GET',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });

        const users = await responce.json()

        return {success:true,data:users}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}