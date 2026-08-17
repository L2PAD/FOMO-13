import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl, configureProjectForm } from '../config';
import { IBannerItem } from "../../types/global_types";

export default async (data:IBannerItem) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }

        const newBannerData = configureProjectForm('POST',
        {...data},
        {'Authorization': `Bearer ${getAccessToken()}`})

        const responce = await fetch(configureUrl(`banner`),newBannerData);

        const resData = await responce.json()

        return {success:responce.status < 300,data:resData}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}