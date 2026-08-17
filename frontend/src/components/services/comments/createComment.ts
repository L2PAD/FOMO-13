import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"
import { IComment } from "../../types/global_types"

export default async (path:string,comment:IComment) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`${path}`),{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body:JSON.stringify({...comment,author:comment.authorId}),
            credentials:'include'
        });

        const data : IComment = await responce.json()

        return {success:true,data:data}

    }catch(error){
        return {success:false,data:{}}
    }
}