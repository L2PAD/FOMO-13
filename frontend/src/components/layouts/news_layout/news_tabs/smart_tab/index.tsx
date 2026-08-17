import React, {useState} from 'react';
import EditIcon from '../../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import SearchIcon from '../../../../common/Icons/search_icon';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import PubItem from './pub_item';
import DescriptionModal from '../../../../common/global_modals/description_modal';

const SmartTab = () => {
    const [isBioModal, setIsBioModal] = useState(false)

    const {
        descriptionWrapper,
        searchWrapper,
        searchInput,
        actionsWrapper,
        pubsWrapper,
    } = useStyles()

    return (
        <div>
            <div className={descriptionWrapper}>
  
            </div>
            <div className={searchWrapper}>
                <SearchIcon />
                <input
                    type="text"
                    placeholder='Search'
                    className={searchInput}
                />
            </div>
            <div className={actionsWrapper}>
                <Filter />
                <SortBy />
            </div>
            <div className={pubsWrapper}>
                <PubItem />
                <PubItem />
                <PubItem />
                <PubItem />
            </div>
            {isBioModal && <DescriptionModal
                onClose={() => setIsBioModal(false)}
            />}
        </div>
    );
};

export default SmartTab;