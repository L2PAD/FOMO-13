import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (path:string,data:any) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`${path}`),{
            method:'PUT',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify(data),
            credentials:'include'
        });


        return {success:true,data:'Project updated'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}