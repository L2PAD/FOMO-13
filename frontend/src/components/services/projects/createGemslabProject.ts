import getAccessToken from "../../utils/getAccessToken"
import { IReturnData } from '../types';
import { configureUrl, configureProjectForm } from '../config';
import { IProject } from "../../hooks/useCreateProject";
import getUserRole from "../../utils/getUserRole";

export default async (data:IProject) : Promise<IReturnData> => {
    try{
        const token : string = getAccessToken()
        
        if(!token){
            throw new Error('Not auth')
        }

        const createProjectData = configureProjectForm('POST',
        {...data,projectType:'gemslab'},
        {'Authorization': `Bearer ${getAccessToken()}`})

        const responce = await fetch(configureUrl(`projects/${getUserRole()}`),createProjectData);

        return {success:responce.status < 300,data:'Project created!'}

    }catch(error){
        console.log(error)
        return {success:false,data:error}
    }
}