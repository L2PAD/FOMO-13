import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"


export default async (keywords:string) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(`${configureUrl('socialparcing')}/admin/keywords`,{
            method:'POST',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({keywords,isSentiment:false}),
            credentials:'include'
        });


        return {success:true,data:'Account added'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}