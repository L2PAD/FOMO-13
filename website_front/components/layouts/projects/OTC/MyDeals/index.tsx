import React from 'react'
import { HeaderActions, Wrapper } from './styles'
import DealsList from '../DealsList'
import { useOtcState } from '../../../../../hooks/useOtc';
import InfoIcon from '../../../../global/Icons/InfoIcon';
import ButtonSwitch from '../../../../UI/inputs/button-switch';
import DescriptionComponent from '../../../../global/common/DescriptionComponent';
import Image from 'next/image';
import BuyIcon from "../../../../../assets/icons/otc/buy-item.svg";
import SellIcon from "../../../../../assets/icons/otc/sell-item.svg";
import PromotedDeals from '../PromotedDeals';
import DealsBalanceComponent from '../../../../global/DealsBalanceComponent';
import { Button } from '../../../../global/common/Button';
import {
    BazzarSwitchWrapper, MobileActionSwitchWrapper, MobileHeaderTitle,
    MobileHeaderTop, MobilePageHeaderWrapper, PageDesciptionWrapper, PageHeaderWrapper,
    PageHeaderWrapperLeft, PageWrapper, TitleWrapper
} from '../styles';

const MyDeals = () => {
    const {
        filterValue,
        activeTab,
        limit,
        pageVariant,
        modal,
        filters,
        searchValue,
        p2pFilterTabs,
        sortBy,
        sortByP2P,
        setLimit,
        handleUpdatePageVariant,
        setModal,
        updateActiveTab,
    } = useOtcState();
    const [isBuyVisible, setIsBuyVisible] = React.useState<boolean>(false);
    const [isSellVisible, setIsSellVisible] = React.useState<boolean>(false);
    const [isSearch, setIsSearch] = React.useState<boolean>(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<
        string[]
    >([]);
    const [selectedCurrency, setSelectedCurrency] = React.useState("UAH");
    const [transactionAmount, setTransactionAmount] = React.useState("");
    const [isDescriptionsVisible, setIsDescriptionsVisible] =
        React.useState<boolean>(false);

    return (
        <PageWrapper>
            <MobilePageHeaderWrapper>
                <MobileHeaderTop>
                    <MobileHeaderTitle>
                        {pageVariant === "p2p" ? "My P2P Deals" : "My OTC Deals"}
                    </MobileHeaderTitle>
                    <ButtonSwitch
                        className="deal-switch"
                        checked={pageVariant === "p2p"}
                        onChange={(checked) =>
                            handleUpdatePageVariant(checked ? "p2p" : "otc")
                        }
                        leftLabel="OTC"
                        rightLabel="P2P"
                    />
                </MobileHeaderTop>
                <MobileActionSwitchWrapper>
                    <button
                        className={activeTab === "Buy" ? "active buy" : "buy"}
                        onClick={() => updateActiveTab("Buy")}
                    >
                        <Image src={BuyIcon} alt="buy" />
                        Buy
                    </button>
                    <button
                        className={activeTab === "Sell" ? "active sell" : "sell"}
                        onClick={() => updateActiveTab("Sell")}
                    >
                        <Image src={SellIcon} alt="sell" />
                        Sell
                    </button>
                </MobileActionSwitchWrapper>
                <HeaderActions className="mobile-header-actions">
                    <div className="mobile-promoted">
                        <PromotedDeals isSearch={isSearch} setIsSearch={setIsSearch} />
                    </div>
                    <DealsBalanceComponent className="my-deals-mobile-balance" />
                    <Button
                        className="create-deal"
                        variant={"outlined"}
                        onClick={() => setModal(true)}
                    >
                        + Create Deal
                    </Button>
                </HeaderActions>
            </MobilePageHeaderWrapper>
            <PageHeaderWrapper>
                <PageHeaderWrapperLeft>
                    <div className="left">
                        <button
                            onMouseEnter={() => setIsDescriptionsVisible(true)}
                            onMouseLeave={() => setIsDescriptionsVisible(false)}
                            className="info-button"
                        >
                            <InfoIcon />
                        </button>
                        <ButtonSwitch
                            className="deal-switch"
                            checked={pageVariant === "p2p"}
                            onChange={(checked) =>
                                handleUpdatePageVariant(checked ? "p2p" : "otc")
                            }
                            leftLabel="OTC"
                            rightLabel="P2P"
                        />
                        <TitleWrapper>
                            <PageDesciptionWrapper>
                                <DescriptionComponent
                                    isDate={false}
                                    date={new Date()}
                                    isVisible={isDescriptionsVisible}
                                    className="gray-description"
                                    text={
                                        pageVariant === "p2p"
                                            ? `
                      <h2>P2P</h2>
                      Trade tokens and digital assets directly with other users in a secure peer-to-peer marketplace.<br/> The P2P Market on FOMO enables safe exchange of tokens, NFTs, whitelist spots, and other on-chain assets.<br/> Create and browse offers, negotiate terms, and finalize deals with full transparency. With the FIAT block, you can also buy or sell crypto with local currencies.
                      `
                                            : `
                      <h2>OTC</h2>
                      Trade crypto assets directly with other users without relying on centralized exchanges. <br/>The Classic OTC Market on FOMO offers a secure space for peer-to-peer deals — whether you’re buying or selling tokens, NFTs, or services.<br/> Create and browse offers, negotiate terms, and finalize transactions with full transparency. No more shady telegram channels or fishing websites.  
                      `
                                    }
                                />
                            </PageDesciptionWrapper>
                        </TitleWrapper>
                        <BazzarSwitchWrapper>
                            <div className="button-wrapper">
                                <button
                                    className={activeTab === "Buy" ? "active buy" : "buy"}
                                    onClick={() => updateActiveTab("Buy")}
                                    onMouseEnter={() => setIsBuyVisible(true)}
                                    onMouseLeave={() => setIsBuyVisible(false)}
                                >
                                    <Image src={BuyIcon} alt="buy" />
                                    Buy
                                </button>
                                <PageDesciptionWrapper className="switch-description">
                                    <DescriptionComponent
                                        isDate={false}
                                        date={new Date()}
                                        isVisible={isBuyVisible}
                                        className="gray-description"
                                        text={`
                      <h2 style="color:var(--main-green)">Buy</h2>
                      Discover a wide range of offers from sellers looking to trade their crypto assets. <br/>Browse listings, compare prices, and choose the best deal that fits your needs. With secure escrow services and transparent terms, buying crypto has never been easier or safer.
                      `}
                                    />
                                </PageDesciptionWrapper>
                            </div>
                            <div className="button-wrapper">
                                <button
                                    onMouseEnter={() => setIsSellVisible(true)}
                                    onMouseLeave={() => setIsSellVisible(false)}
                                    className={
                                        activeTab === "Sell" ? "active sell" : "sell"
                                    }
                                    onClick={() => updateActiveTab("Sell")}
                                >
                                    <Image src={SellIcon} alt="sell" />
                                    Sell
                                </button>
                                <PageDesciptionWrapper className="switch-description">
                                    <DescriptionComponent
                                        isDate={false}
                                        date={new Date()}
                                        isVisible={isSellVisible}
                                        className="gray-description"
                                        text={`
                      <h2 style="color:var(--main-red)">Sell</h2>
                      List your crypto assets for sale and connect with buyers directly. <br/>Create offers, set terms, and finalize deals with full transparency. <br/>With secure escrow services and transparent terms, selling crypto has never been easier or safer.
                      `}
                                    />
                                </PageDesciptionWrapper>
                            </div>
                        </BazzarSwitchWrapper>
                    </div>
                    <PromotedDeals isSearch={isSearch} setIsSearch={setIsSearch} />
                </PageHeaderWrapperLeft>
                <HeaderActions>
                    <DealsBalanceComponent />
                    <Button
                        className="create-deal"
                        variant={"outlined"}
                        onClick={() => setModal(true)}
                    >
                        + Create Deal
                    </Button>
                </HeaderActions>
            </PageHeaderWrapper>
            <Wrapper>
                <DealsList
                    settingsP2P={{
                        transactionAmount,
                        p2pFilterTabs,
                        filterValue,
                        selectedCurrency,
                        selectedPaymentMethod,
                        sortBy: sortByP2P,
                    }}
                    searchValue={searchValue}
                    pageVariant={pageVariant}
                    sortBy={sortBy.deals}
                    filters={filters}
                    isCreateDeal={modal}
                    setIsCreateDeal={(value: boolean) => setModal(value)}
                    limit={limit}
                    setLimit={(value: number) => setLimit(value)}
                    activeTab={activeTab}
                    isMyDeals
                    type="all"
                    isP2p={pageVariant === "p2p"}
                />
            </Wrapper>
        </PageWrapper>
    )
}

export default MyDeals
