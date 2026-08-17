import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export default async (path:string,id:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`${path}/${id}`),{
            method:'DELETE',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });


        return {success:true,data:{}}

    }catch(error){
        return {success:false,data:{}}
    }
}