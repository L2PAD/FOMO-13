import {useState,useEffect} from 'react';
import SearchIcon from '../../../../common/Icons/search_icon';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import SearchBar from '../../../../common/search';
import Button from '../../../../common/button';
import {useStyles} from './styles';
import AddModal from '../../modals/add_modal';
import useFetch from '../../../../hooks/useFetch';
import Loader from '../../../../common/loader';
import { IProject } from '../../../../hooks/useCreateProject';
import reloadWindow from '../../../../utils/reloadWindow';

const Header = () => {
    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
        actionsWrapper,
    } = useStyles()

    const {data,loading} = useFetch('projects')

    const [recommendModal, setRecommendModal] = useState(false)
    const [projects,setProjects] = useState<Array<IProject>>()
    const [selectedProject,setSelectedProject] = useState<IProject>()

    useEffect(() => {
        if(data?.data?.length){
            setProjects(data.data)
            setSelectedProject(data.data[0])
        }
    },[data])

    if(loading || !projects || !selectedProject){
        return <Loader/>
    }

    return (
        <div className={wrapper}>
            <div className={leftWrapper}>
                <h1 className={mainTitle}>
                    Recommendation
                </h1>
                <SearchBar/>
                <Filter />
                <SortBy />
            </div>
            <div className={actionsWrapper}>
                <Button type='bordered' onClick={() => setRecommendModal(true)}>
                    Add to recommendation
                </Button>
            </div>
            {
            recommendModal 
            ? 
            <AddModal 
            section='earlyland'
            type='recommendations'
            selectedProject={selectedProject}
            projects={projects}
            title='Add to recommendation'
            onChange={setSelectedProject}
            onClose={() => setRecommendModal(false)} />
            :
            <></>
            }
        </div>
    );
};

export default Header;