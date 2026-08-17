import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export default async () : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()

        if(!token){
            throw new Error('Not auth')
        }

        const responce = await fetch(configureUrl(`excel/users`),{
            method:'GET',
            headers:{
                'Authorization': `Bearer ${token}`,
            },
            credentials:'include'
        });

        const blob = await responce.blob()

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return {success:true,data:{}}

    }catch(error){
        return {success:false,data:{}}
    }
}