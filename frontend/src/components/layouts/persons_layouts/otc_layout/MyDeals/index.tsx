import React, {useState} from 'react';
import {
    SearchWrapper,
    HeaderWrapper,
    ContentWrapper,
    useStyles,
} from './styles';
import {OptionsForSortProjectsPage} from '../../../../../static_content/global';
import {HeaderSwitchWrapper, SwitchButton} from '../TopMembers/styles';
import Filter from '../../../../common/filter';
import Item from './item';
import SearchIcon from '../../../../common/Icons/search_icon';
import SortBy from '../../../../common/sort_by';

const MyDeals = () => {
    const [sortValue, setSortValue] = useState(OptionsForSortProjectsPage[0])
    const [active, setActive] = useState(true)

    const {
        searchWrapper,
        searchInput,
    } = useStyles()

    return (
        <div>
            <HeaderSwitchWrapper>
                <SwitchButton
                    onClick={() => setActive(true)}
                    active={active}
                >
                    Active
                </SwitchButton>
                <SwitchButton
                    onClick={() => setActive(false)}
                    active={!active}
                >
                    Ended
                </SwitchButton>
            </HeaderSwitchWrapper>
            <SearchWrapper>
                <div className={searchWrapper}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder='Search'
                        className={searchInput}
                    />
                </div>
            </SearchWrapper>
            <HeaderWrapper>
                <Filter />
                <SortBy />
            </HeaderWrapper>
            <ContentWrapper>
                <Item />
                <Item />
                <Item />
                <Item />
            </ContentWrapper>
        </div>
    );
};

export default MyDeals;