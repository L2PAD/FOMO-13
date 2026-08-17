import React, { FC, useState, useRef, useEffect } from 'react'
import Image from 'next/image';
import Typography from '../common/Typography';
import { DealSortTypes } from '../../../hooks/useDealsList';
import { TopMembersSortBy } from '../../layouts/projects/OTC/TopMembers';
import AllIcon from "../../../assets/icons/all-sort.svg";
import { FilterButton, SortDropdown, SortOption } from './styles'

interface IProps {
    sortKey: 'deals' | 'members'
    setSortBy: React.Dispatch<React.SetStateAction<{ deals: DealSortTypes; members: TopMembersSortBy }>>
    sortBy: { deals: DealSortTypes, members: TopMembersSortBy }
    tabs: { key: string; name: string }[]
    className?: string
}

const OtcSort: FC<IProps> = ({ tabs, sortKey, setSortBy, sortBy, className }) => {
    const [isActive, setIsActive] = useState(false);
    const dropdownRef = useRef<any>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSortSelect = (key: string) => {
        setSortBy((prev: { deals: DealSortTypes, members: TopMembersSortBy }) => ({
            ...prev,
            [sortKey]: key as DealSortTypes | TopMembersSortBy
        }));
        setIsActive(false);
    };

    return (
        <FilterButton
            newSort
            ref={dropdownRef}
            onClick={() => setIsActive(!isActive)}
            className={className}
        >
            <div
                className="sort-trigger"
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.0625 2.46875L9.03125 0.5M9.03125 0.5L11 2.46875M9.03125 0.5L9.03125 11M4.4375 9.03125L2.46875 11M2.46875 11L0.5 9.03125M2.46875 11L2.46875 0.5" stroke="#728094" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <Typography variant="p">Sort</Typography>
            </div>
            <SortDropdown
                isVisible={isActive}
                className="sort-dropdown">
                {tabs.map((item) => (
                    <SortOption
                        key={item.key}
                        className={sortBy[sortKey] === item.key ? "selected" : ""}
                        onClick={() => handleSortSelect(item.key)}
                    >
                        <div className="option-content">
                            {item.key === "newest" && (
                                <div className="icon-wrapper">
                                    <Image src={AllIcon} alt="all" width={16} height={16} />
                                </div>
                            )}
                            <span className="option-name">{item.name}</span>
                        </div>
                        {sortBy[sortKey] === item.key && (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M13.3334 4L6.00002 11.3333L2.66669 8"
                                    stroke="var(--main-green)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </SortOption>
                ))}
            </SortDropdown>
        </FilterButton>
    )
}

export default OtcSort