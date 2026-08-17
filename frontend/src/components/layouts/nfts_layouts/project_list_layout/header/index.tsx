import {useState} from 'react';
import Button from '../../../../common/button';
import SearchIcon from '../../../../common/Icons/search_icon';
import Filter from '../../../../common/filter';
import SearchBar from '../../../../common/search';
import SortBy from '../../../../common/sort_by';
import {useStyles} from './styles';
import CreatingProjectModal from '../../modals/creating_project';

const Header = () => {
    const [createProjectModal, setCreateProjectModal] = useState(false)
    const [addInvestorsModal, setAddInvestorsModal] = useState(false)
    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
        createProjectWrapper,
    } = useStyles(createProjectModal)

    return (
        <div className={wrapper}>
            <div className={leftWrapper}>
                <h1 className={mainTitle}>
                    Nfts list
                </h1>
                <SearchBar/>
                <Filter />
                <SortBy />
            </div>
            <Button type='bordered' onClick={() => setCreateProjectModal(true)}>
                Create nft
            </Button>
            <div className={createProjectWrapper}>
            <CreatingProjectModal
                backToCreatingModal={() => {
                    setCreateProjectModal(true)
                    setAddInvestorsModal(false)
                }}
                onClose={() => setCreateProjectModal(false)}
                hideModal={() => {
                    setAddInvestorsModal(true)
                }}
                isAddInvestorsModal={addInvestorsModal}
            />
            </div>
        </div>
    );
};

export default Header;