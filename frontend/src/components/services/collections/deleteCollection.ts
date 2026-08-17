import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"

export default async (id:string) : Promise<{success:boolean}> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`collections/${id}`),{
            method:'DELETE',
            headers:{
                'Authorization': `Bearer ${token}`,
            },
            credentials:'include'
        });

        return {success:responce.status < 300}

    }catch(error){
        console.log(error)

        return {success:false}
    }
}