import React, { useContext } from 'react';
import { OtcFilterContext } from '../../../../../pages/UsersList/UsersListOtc';
import SearchIcon from '../../../../common/Icons/search_icon';
import OtcFilter from '../../../../common/otc_filter/otc_filter';
import SortBy from '../../../../common/sort_by';
import SortByProps from '../../../../common/sort_by_props';
import { useStyles } from './styles';

const Header = () => {
    const {
        filters,
        onFiltersChange,
        onSortChange,
        searchValue,
        onSearchChange,
        onReset
    } = useContext(OtcFilterContext)
    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={leftWrapper}>
                <h1 className={mainTitle}>
                    Deals
                </h1>
                <div className={searchWrapper}>
                    <SearchIcon />
                    <input
                        value={searchValue}
                        onChange={(e: any) => onSearchChange(e.target.value)}
                        type="text"
                        placeholder='Search'
                        className={searchInput}
                    />
                </div>
                <OtcFilter
                    onSave={onFiltersChange}
                    onReset={onReset}
                />
                <SortByProps
                    defaultValue='New'
                    variant={'otc'}
                    onChange={onSortChange}
                />
            </div>
        </div>
    );
};

export default Header;