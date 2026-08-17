import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"


export default async (id:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`socialparcing/${id}`),{
            method:'DELETE',
            headers:{
                'Authorization': `Bearer ${token}`,
            },
            credentials:'include'
        });

        return {success:true,data:'Account deleted'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}