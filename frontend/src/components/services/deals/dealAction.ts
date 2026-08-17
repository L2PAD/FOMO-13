import { localApi } from "../config"
import { IDeal } from "../../types/global_types"
import getAccessToken from "../../utils/getAccessToken"

export default async (action:string,id:string,method?:'PUT' | 'POST') : Promise<{isSuccess:boolean,deal:IDeal | null}> => {
    try{
        const accessToken : string | null = getAccessToken() 

        const res = await fetch(`${localApi}/deals/${action}/${id}`,{
            method:method || 'PUT',
            headers:{
                'Authorization':`Bearer ${accessToken}`,
                'Content-Type':'application/json'
            },
        })

        const data = await res.json()

        return {isSuccess:res.status < 300,deal:data}
    }catch(error){
        console.log(error)

        return {isSuccess:false,deal:null}
    }
}