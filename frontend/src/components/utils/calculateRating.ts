import { IProject } from '../hooks/useCreateProject';

export default (data:IProject) : number => {
    let rating = 100

    if(!data.investors?.length){
        rating -= 10
    }
    if(!data.totalRaised){
        rating -= 2
    }
    if(!data.banner){
        rating -= 2
    }

    return rating
}