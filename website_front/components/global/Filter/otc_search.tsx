import React, { FC, useState, useRef, useEffect } from 'react'
import Image from 'next/image';
import Typography from '../common/Typography';
import { DealSortTypes } from '../../../hooks/useDealsList';
import { TopMembersSortBy } from '../../layouts/projects/OTC/TopMembers';
import AllIcon from "../../../assets/icons/all-sort.svg";
import { FilterButton, SearchButton, SortDropdown, SortOption } from './styles'
import { SearchIcon } from '../Icons';
import { SearchInput } from '../../layouts/projects/Networks/styles';
import { SearchIconStyle } from '../About/styles';

interface IProps {
    isSearch: boolean;
    searchValue: string
    setIsSearch: (value: boolean) => void;
    setSearchValue: (value: string) => void
}

const OtcSearch: FC<IProps> = ({ isSearch, setIsSearch, searchValue, setSearchValue }) => {
    const [isActive, setIsActive] = useState<boolean>(false);
    const dropdownRef = useRef<any>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSearch(false);
                setIsActive(false)
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setIsSearch]);

    const isVisible: boolean = isActive && isSearch

    return (
        <SearchButton
            ref={dropdownRef}
            className={isVisible ? 'active' : ''}
        >
            <SearchIcon className='search' fill='var(--main-gray)' />
            <div className={isVisible ? 'search-dropdown active' : 'search-dropdown'}>
                <input
                    onFocus={() => {
                        if (window.innerWidth <= 1120) {
                            return;
                        }
                        
                        if (!isSearch) {
                            setIsSearch(true)
                            setTimeout(() => setIsActive(true), 300)
                        } else {
                            setIsSearch(false)
                        }
                    }}
                    onBlur={() => setIsSearch(false)}
                    placeholder="Search"
                    type="text"
                    value={searchValue || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                />
            </div>
        </SearchButton>
    )
}

export default OtcSearch
