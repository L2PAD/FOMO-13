import { configureUrl } from "../config";
import { IReturnData } from "../types";

export default async () : Promise<IReturnData> => {
    try{
        const projectsResponce = await fetch(configureUrl(`persons`),{
            method:'GET',
        });
        const persons = await projectsResponce.json()

        return {success:true,data:persons}

    }catch(error){
        console.log(error)
        return {success:false,data:[]}
    }
}