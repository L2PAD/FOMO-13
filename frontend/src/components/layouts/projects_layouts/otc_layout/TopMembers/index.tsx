import React, {useState} from 'react';
import {
    SearchWrapper,
    HeaderWrapper,
    ContentWrapper,
    HeaderSwitchWrapper, SwitchButton,
    useStyles,
} from './styles';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import SearchIcon from '../../../../common/Icons/search_icon';
import Item from './item';

const TopMembers = () => {
    const [topUser, setTopUsers] = useState(true)

    const {
        searchWrapper,
        searchInput,
    } = useStyles()

    return (
        <div>
            <HeaderSwitchWrapper>
                <SwitchButton
                    onClick={() => setTopUsers(true)}
                    active={topUser}
                >
                    Top users
                </SwitchButton>
                <SwitchButton
                    onClick={() => setTopUsers(false)}
                    active={!topUser}
                >
                    Comments
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

export default TopMembers;