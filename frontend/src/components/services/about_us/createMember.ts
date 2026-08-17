import getAccessToken from "../../utils/getAccessToken"
import { configureFetchForm, configureUrl } from "../config"
import { IReturnData } from "../types"
import { IComment, ICreateMember, IMember } from "../../types/global_types"

export default async (member:ICreateMember,memberType:'member' | 'team') : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`about/${memberType}`),
        {...configureFetchForm('POST',member,{'Authorization': `Bearer ${token}`}),credentials:'include'}
        );

        const data : IMember = await responce.json()

        return {success:true,data:data}

    }catch(error){
        return {success:false,data:{}}
    }
}