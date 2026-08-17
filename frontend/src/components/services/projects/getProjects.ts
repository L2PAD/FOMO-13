import { configureUrl } from "../config";
import { IReturnData } from "../types";

export default async (page:string) : Promise<IReturnData> => {
    try{
        const projectsResponce = await fetch(configureUrl(`projects/${page}`),{
            method:'GET',
        });
        // const nftsResponce = await fetch(configureUrl(`nft/${page}`),{
        //     method:'GET',
        // });

        const projects = await projectsResponce.json()

        // const nfts = await nftsResponce.json()

        return {success:true,data:[...projects]}

    }catch(error){
        console.log(error)
        return {success:false,data:[]}
    }
}