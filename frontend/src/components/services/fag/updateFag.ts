import { FAQItem } from "../../layouts/settings_layout/FAQ_layout"
import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export default async (id:string,faqData:FAQItem) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`faq/${id}`),{
            method:'PUT',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            credentials:'include',
            body:JSON.stringify(faqData)
        });

        const data = await responce.json()

        return {success:responce.status < 300,data}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}