import { ILoginData , IReturnData} from "../types"
import { configureUrl } from '../config'
import getAccessToken from "../../utils/getAccessToken";
import getUserRole from "../../utils/getUserRole";

export const checkAuth = async () : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }
        const role : string = getUserRole() === 'admin' ? 'checkAdmin' : 'checkModerator'

        const responce = await fetch(configureUrl(`user/${role}`),{
            method:'POST',
            headers:{
                'Authorization': `Bearer ${token}`
            },
            credentials:'include'
        });

        const {accessToken  ,id ,user} = await responce.json()

        localStorage.setItem('fomoUser',JSON.stringify(user))
        localStorage.setItem('fomoAccessToken',accessToken)
        localStorage.setItem('fomoUserId',id._id)

        return {success:!!accessToken,data:accessToken}
    }catch(error){
        console.log(error)
        return {success:false}
    }
}