import React, {useState} from 'react';
import Button from '../../../../common/button';
import SearchIcon from '../../../../common/Icons/search_icon';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import {useStyles} from './styles';
import AddProject from '../../modals/add_project';

const Header = () => {
    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
    } = useStyles()

    const [addModal, setAddModal] = useState(false)

    return (
        <div className={wrapper}>
            <div className={leftWrapper}>
                <h1 className={mainTitle}>
                    Market list
                </h1>
                <div className={searchWrapper}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder='Search'
                        className={searchInput}
                    />
                </div>
                <Filter />
                <SortBy />
            </div>
            <Button type='bordered' onClick={() => console.log(1)}>
                Add project
            </Button>
            {addModal && <AddProject onClose={() => setAddModal(false)}/>}
        </div>
    );
};

export default Header;