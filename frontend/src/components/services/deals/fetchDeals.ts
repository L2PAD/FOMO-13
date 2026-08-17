import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export default async (queryString:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`deals/otc/all${queryString}`),{
            method:'GET',
            headers:{
                'Authorization': `Bearer ${token}`,
            },
            credentials:'include',
        });

        const data = await responce.json()

        return {success:responce.status < 300,data}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}