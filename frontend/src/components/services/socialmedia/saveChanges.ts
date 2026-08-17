import { ISocialItem } from "../../types/global_types"
import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"


export default async (items:Array<ISocialItem>) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl('layout/socialmedia'),{
            method:'POST',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({items}),
            credentials:'include'
        });


        return {success:true,data:'Social media changed'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}