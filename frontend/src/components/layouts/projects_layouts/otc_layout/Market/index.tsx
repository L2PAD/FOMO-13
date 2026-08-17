import {
    SearchWrapper,
    HeaderWrapper,
    ContentWrapper, useStyles,
} from './styles';
import Filter from '../../../../common/filter';
import Item from './item';
import SortBy from '../../../../common/sort_by';
import SearchIcon from '../../../../common/Icons/search_icon';

const Market = () => {
    const {
        searchWrapper,
        searchInput,
    } = useStyles()

    return (
        <div>
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

export default Market;