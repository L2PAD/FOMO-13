import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"
import { IMessageTelegram } from "../../types/global_types"

export default async (email:string,message:IMessageTelegram) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        const formData = new FormData()

        formData.append('title',message.title)
        formData.append('message',message.message)
        message.file && formData.append('file',message.file)

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`email/${email}`),{
            method:'POST',
            headers:{
                'Authorization': `Bearer ${token}`,
            },
            body:formData,
            credentials:'include'
        });

        return {success:true,data:{}}

    }catch(error){
        return {success:false,data:{}}
    }
}