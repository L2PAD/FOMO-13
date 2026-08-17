import { ILoginData , IReturnData} from "../types"
import { configureUrl } from '../config'

export const login = async (loginData : ILoginData) : Promise<IReturnData> => {
    try{
        const responce = await fetch(configureUrl('user/admin/login'),{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            credentials:'include',
            body:JSON.stringify(loginData)
        });

        const {user,accessToken} = await responce.json()

        if(accessToken){
            localStorage.setItem('fomoAccessToken',accessToken)
            localStorage.setItem('fomoUser',JSON.stringify(user))
        }

        if(user.role.includes('admin')){
            localStorage.setItem('fomoRole','admin')

        }else if(user.role.includes('moderator')){
            localStorage.setItem('fomoRole','moderator')    
        }

        
        return {success:!!user,data:user}
    }catch(error){
        console.log(error)
        return {success:false}
    }
}