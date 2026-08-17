import getAccessToken from "../../utils/getAccessToken"
import { configureFetchForm, configureUrl } from "../config"
import { IReturnData } from "../types"
import { ICreatePartner , IPartner} from "../../types/global_types"

export default async (member:ICreatePartner) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`about/partner`),
        {...configureFetchForm('POST',member,{'Authorization': `Bearer ${token}`}),credentials:'include'}
        );

        const data : IPartner = await responce.json()

        return {success:true,data:data}

    }catch(error){
        return {success:false,data:{}}
    }
}