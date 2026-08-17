import {useState,useCallback,useEffect} from 'react';
import avatarImage from '../../assets/img/avatar.png';
import calculatePageFullness from '../utils/calculatePageFullness';
import calculateRating from '../utils/calculateRating';
import { IProject } from './useCreateProject';
import { useSelector } from 'react-redux';

const investorsData = [
    {
        _id:'11',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'12',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'13',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'14',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'15',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
]

const useUpdateProject = (type?:string) => {
    const updatedProject = useSelector((state:any) => state.project.updatedProject)
    
    const checkInvestors = typeof updatedProject.investors === 'string'

    const [dataHook,setDataHook] = useState(false)
    const [data,setData] = useState<IProject>(
        {...updatedProject,investors:updatedProject.investors}
    )
    const inputsHandler = useCallback((value:any,inputName:string,index?:number) => {
        setData({...data,[inputName]:value})
        setDataHook(!dataHook)
    },[data,dataHook])

    useEffect(() => {
        setData((prev:IProject) => {
            return {...prev,fullness:calculatePageFullness(prev),rating:String(calculateRating(prev))}
        })
    },[dataHook])

    return {data,inputsHandler}
}

export default useUpdateProject