import { IProject } from '../../hooks/useCreateProject';
import getAccessToken from '../../utils/getAccessToken';
import { configureUrl } from '../config';

export default async (type:string,status?:string,sortValue?:any,query?:string) : Promise<{isSuccess:boolean,projects:Array<IProject>}> => {
    try{
        const accessToken : string | null = getAccessToken() 

        let path = `${type}`

        if(status && !query) path = path + `?status=${status}`
        if(sortValue && !query) path = path + `&sort=${sortValue}`
        if(query) path = query

        const res = await fetch(configureUrl(`projects/${path}`),{
            method:'GET',
            headers:{
                'Authorization':`Bearer ${accessToken}`,
            },
        })

        const data = await res.json()

        return {isSuccess:res.status < 300,projects:data?.projects || []}
    }catch(error){
        console.log(error)

        return {isSuccess:false,projects:[]}
    }
}   