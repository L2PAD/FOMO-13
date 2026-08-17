import React, {useState} from 'react';
import Button from '../../../../common/button';
import SearchIcon from '../../../../common/Icons/search_icon';
import SearchBar from '../../../../common/search';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import {useStyles} from './styles';
import CreatingProjectModal from '../../modals/creating_project';
import AddInvestorsModal from '../../modals/add_investors_modal';

const Header = () => {
    const [isCreatingModal, setIsCreatingModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [hideStepsModal, setHideStepsModal] = useState(false)

    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
        creatingModalWrapper,
    } = useStyles({isCreatingModal})

    return (
        <>
            <div className={wrapper}>
                <div className={leftWrapper}>
                    <h1 className={mainTitle}>
                        Funds list
                    </h1>
                    <SearchBar/>
                    <Filter />
                    <SortBy />
                </div>
                <Button type='bordered' onClick={() => setIsCreatingModal(true)}>
                    Create fund
                </Button>
            </div>
            <div className={creatingModalWrapper}>
                <CreatingProjectModal
                    isAddInvestorsModal={isAddInvestorsModal}
                    onClose={() => setIsCreatingModal(false)}
                    backToCreatingModal={() => {
                        setIsAddInvestorsModal(false)
                    }}
                    hideModal={() => {
                        setHideStepsModal(true)
                        setIsAddInvestorsModal(true)
                    }}
                />
            </div>
        </>
    );
};

export default Header;