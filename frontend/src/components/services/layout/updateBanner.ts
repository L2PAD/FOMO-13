import { IBannerSettings } from "../../common/banner"
import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"


export default async (banner:IBannerSettings) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`layout/banner`),{
            method:'POST',
            headers:{
                'Authorization': `Bearer ${token}`,
                'Content-Type':'application/json'
            },
            credentials:'include',
            body:JSON.stringify({
                text: banner.text,
                link: banner.link,
                isVisible: banner.isVisible,
            })
        });

        return {success:true,data:'Banner updated'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}
