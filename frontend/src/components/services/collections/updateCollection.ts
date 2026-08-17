import { ICollection } from "../../types/global_types"
import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export default async (collection:ICollection) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`collections/${collection._id}`),{
            method:'PUT',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({...collection,project:collection.project?._id}),
            credentials:'include'
        });

        const data = await responce.json()

        return {success:responce.status < 300,data}

    }catch(error){
        console.log(error)

        return {success:false,data:error}
    }
}