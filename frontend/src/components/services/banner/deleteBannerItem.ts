import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (path:string,id:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        const responce = await fetch(configureUrl(`${path}/${id}`),{
            method:'DELETE',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });


        return {success:responce.status < 300,data:'Banner deleted'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}