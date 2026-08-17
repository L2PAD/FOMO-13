import React, { FC, useState, useRef, useEffect } from 'react'
import Image from 'next/image';
import Typography from '../common/Typography';
import { DealSortTypes } from '../../../hooks/useDealsList';
import { TopMembersSortBy } from '../../layouts/projects/OTC/TopMembers';
import AllIcon from "../../../assets/icons/all-sort.svg";
import { FilterButton, FilterWrapper, SettingsWrapper, SortDropdown, SortOption } from './styles'
import { TableHeaderRightWrapper } from '../../layouts/projects/CryptoMarket/styles';
import CurrencyDropdown from '../../UI/CurrencyDropdown';
import CurrencyAmountDropdown, { CurrencyOption } from '../../UI/CurrencyAmountDropdown';
import CustomDropdown from '../../UI/CustomDropdown';
import { paymentMethodOptions } from '../../layouts/projects/OTC';

export type SortP2PType = {
    name: string;
    key: string;
}

export const sortByValues: SortP2PType[] = [
    {
        name: "All",
        key: 'newest'
    },
    {
        name: "Oldest",
        key: 'oldest'
    },
    {
        name: "Top Reactions",
        key: 'reactions-desc'
    },
    {
        name: "Price (low to high)",
        key: 'price-asc'
    },
    {
        name: "Price (high to low)",
        key: 'price-desc'
    },
    {
        name: "Amount (low to high)",
        key: 'amount-asc'
    },
    {
        name: "Amount (high to low)",
        key: 'amount-desc'
    },
]

const currencyAmountOptions: CurrencyOption[] = [
    { code: "EUR", name: "Euro", icon: "€", color: "#3498DB" },
    { code: "UAH", name: "Ukrainian Hryvnia", icon: "₴", color: "#3498DB" },
];


interface IProps {
    transactionAmount: string
    selectedPaymentMethod: string[]
    selectedCurrency: string
    p2pFilterTabs: string[]
    filterValue: string
    sortBy: SortP2PType
    setTransactionAmount: (value: string) => void
    setSelectedPaymentMethod: (value: string[]) => void
    setFilterValue: (value: string) => void
    setSelectedCurrency: (value: string) => void
    setSortByP2p: (value: SortP2PType) => void
    buttonClassName?: string
    dropdownClassName?: string
    wrapperClassName?: string
}

const P2PSettings: FC<IProps> = ({
    setSortByP2p,
    transactionAmount,
    setTransactionAmount,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    selectedCurrency,
    setSelectedCurrency,
    sortBy,
    p2pFilterTabs,
    filterValue,
    setFilterValue,
    buttonClassName,
    dropdownClassName,
    wrapperClassName
}) => {
    const [isActive, setIsActive] = useState(false);
    const dropdownRef = useRef<any>(null);
    const btnRef = useRef<any>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isDrobpdownClick = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
            if (isDrobpdownClick && btnRef.current && !btnRef.current.contains(event.target as Node)) {
                setIsActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <SettingsWrapper className={wrapperClassName}>
            <FilterButton
                ref={btnRef}
                newSort
                onClick={() => setIsActive(!isActive)}
                className={buttonClassName}
            >
                <div
                    className="sort-trigger"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.37099 8.70312V5.96875L11.1571 2.18269C11.3674 1.97236 11.4375 1.76202 11.4375 1.48157C11.4375 0.920671 11.0168 0.5 10.4559 0.5H1.48157C0.920681 0.5 0.5 0.920671 0.5 1.48157C0.5 1.76202 0.570119 1.97236 0.780457 2.18269L4.56651 5.96875V11.4375L7.37099 8.70312Z" stroke="#728094" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <Typography variant="p">Settings</Typography>
                </div>
            </FilterButton>
            <SortDropdown
                ref={dropdownRef}
                isVisible={isActive}
                className={`settings-dropdown ${dropdownClassName ?? ""}`.trim()}>
                <TableHeaderRightWrapper className="left select">
                    <CurrencyAmountDropdown
                        options={currencyAmountOptions}
                        value={selectedCurrency}
                        onChange={setSelectedCurrency}
                        placeholder="Transaction amount"
                        amount={transactionAmount}
                        onAmountChange={setTransactionAmount}
                    />
                    <CustomDropdown
                        isShowSuccess={false}
                        options={paymentMethodOptions}
                        value={selectedPaymentMethod}
                        onChange={(value) => setSelectedPaymentMethod(value as string[])}
                        placeholder="All payment methods"
                        multiSelect={true}
                        searchable={true}
                        showIcons={true}
                        className="payment-dropdown"
                    />
                </TableHeaderRightWrapper>
                <FilterWrapper>
                    <div className='sort-wrapper'>
                        <div className='sort-title'>
                            Cryptocurrency
                        </div>
                        <TableHeaderRightWrapper className="left">
                            {p2pFilterTabs.length > 0 && p2pFilterTabs.map((item) => (
                                <button
                                    key={item}
                                    className={filterValue === item ? "selectedSort" : ""}
                                    onClick={() => setFilterValue(item)}
                                >
                                    {item === "All" && <Image src={AllIcon} alt="all" />}
                                    {item}
                                </button>
                            ))}
                        </TableHeaderRightWrapper>
                    </div>
                    <div className='sort-wrapper'>
                        <div className='sort-title'>
                            Sort by
                        </div>
                        <TableHeaderRightWrapper className="sort-options">
                            {sortByValues.length > 0 && sortByValues.map((item: SortP2PType) => (
                                <button
                                    key={item.key}
                                    className={sortBy.key === item.key ? "selectedSort" : ""}
                                    onClick={() => setSortByP2p(item)}
                                >
                                    {item.name === "All" && <Image src={AllIcon} alt="all" />}
                                    {item.name}
                                </button>
                            ))}
                        </TableHeaderRightWrapper>
                    </div>
                </FilterWrapper>
            </SortDropdown>
        </SettingsWrapper>
    )
}

export default P2PSettings
