import React, { useEffect, useState, useMemo, useContext } from "react";
import { Wrapper, Header, List, ListItem, ListItemHeader, ListItemStats, AddBtnWrapper, LeftColumn, RightColumn, MainInfoWrapper, ParsingDetails } from './styles';
import fetchTradingTrends from "../../../../../http/trading/fetchTradingTrends";
import { ITradingData, ITradingStatsData } from "../../../../../types/global_types";
import { LoadingContext } from "../../../../global/Layout";
import Placeholder from "../../../../global/common/Placeholder";
import ImageModal from "../../../../global/ImageModal";
import { Button } from "../../../../global/common/Button";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import EntityInfo from "../../../../global/common/EntityInfo";
import imageLoader from "../../../../../helpers/imageLoader";
import useTrendingTokens from "../../../../../hooks/useTradingTokens";
import PercentValue from "../../../../global/common/PercentValue";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import CreateTradingModal from "../../modals/CreateTradingModal";
import { useQuery } from "react-query";
import fetchTwitterAccs from "../../../../../http/parcing/fetchTwitterAccs";
import MoodBar from "../../../../global/MoodBar";
import NnHistoryChart from "../../../../global/common/PriceChart/NnHistoryChart";
import moment from "moment";
import { ModeSwitchWrapper } from "../styles";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import { useTranslation } from "i18n";

type Props = {
};

const TrendingTokensAnalytics: React.FC<Props> = () => {
    const { translateText } = useTranslation();
    const [mode, setMode] = useState<'Public' | 'My Tracks'>('Public')
    const {
        filteredTokens,
        filterValue,
        setFilterValue,
        openItems,
        toggleItem,
        modalImage,
        openImage,
        hiddenTokens,
        toggleTokenVisibility,
        itemToEdit,
        setItemToEdit,
        itemToDelete,
        setItemToDelete,
        actionModalId,
        setActionModalId,
        refetch,
        isLoading,
    } = useTrendingTokens(mode === 'Public' ? 'public' : 'private');
    const { data } = useQuery(
        ["custom-twitter-accs"],
        () => {
            return fetchTwitterAccs(`/user?sortBy=createdAt&order=desc`);
        },
        { refetchInterval: 60 * 1000, refetchOnWindowFocus: false }
    );
    const [isCreateTrading, setIsCreateTrading] = useState<boolean>(false);


    return (
        <Wrapper>
            <Header>
                <div className="title">{translateText("Trending Tokens")}</div>
                <div className="actions">
                    <ButtonSwitch
                        className="bg-switch"
                        rightLabel={translateText("Public")}
                        leftLabel={translateText("My Tracks")}
                        onChange={(value: boolean) =>
                            setMode(value ? "Public" : "My Tracks")
                        }
                        checked={mode === "Public"}
                    />
                    <Button
                        variant={"primary"}
                        onClick={() => setIsCreateTrading(true)}
                    >
                        {translateText("Add Token Track")}
                    </Button>
                </div>
            </Header>

            {isLoading && (
                <Placeholder
                    height="200px"
                    description={translateText("Loading tokens...")}
                />
            )}

            <List>
                {filteredTokens.map((token: ITradingData, i) => (
                    <ListItem variant="main" key={token.coinId}>
                        <MainInfoWrapper>
                            <LeftColumn>
                                <ListItemHeader onClick={() => toggleItem(i)}>
                                    <EntityInfo
                                        size={'project-page'}
                                        img={token.logo || ''}
                                        name={token.name || ''}
                                        niche={token.currentData.symbol}
                                        variant="default"
                                    />
                                    <ParsingDetails>
                                        <div className="d-item">
                                            <div className="d-key">
                                                {translateText("Last Update")}
                                            </div>
                                            <div className="d-value">
                                                {
                                                    moment(token.currentData.timestamp).format('hh:mm:ss')
                                                }
                                            </div>
                                        </div>
                                    </ParsingDetails>
                                </ListItemHeader>
                                <ListItemStats>
                                    <div className="stats-item">
                                        <div className="keywords">{translateText("Price")}</div>
                                        <div className="stats-value">${simplifyAmount(token.currentData.priceUSD)}</div>
                                    </div>
                                    <div style={{ paddingLeft: '4px' }} className="stats-item">
                                        <div className="keywords">1h</div>
                                        <PercentValue
                                            size="small"
                                            value={token.currentData.percentChange1h || 0}
                                            rightLabel="%"
                                        />
                                    </div>
                                    <div style={{ paddingLeft: '4px' }} className="stats-item">
                                        <div className="keywords">24h</div>
                                        <PercentValue
                                            size="small"
                                            value={token.currentData.percentChange24h || 0}
                                            rightLabel="%"
                                        />
                                    </div>
                                    <div className="stats-item">
                                        <div className="keywords">{translateText("Market Cap")}</div>
                                        <div className="stats-value">${clarifyAmount(token.currentData.marketCap)}</div>
                                    </div>
                                    <div className="stats-item">
                                        <div className="keywords">{translateText("Volume 24h")}</div>
                                        <div className="stats-value">${token.currentData.volume24h.toLocaleString()}</div>
                                    </div>
                                    <div className="stats-item prediction-stats">
                                        <div className="keywords">{translateText("Prediction change 1H")}</div>
                                        <PercentValue
                                            value={token.currentData.neuralNetworkPrediction.probabilityUp || 0}
                                            rightLabel="%"
                                        />
                                    </div>
                                    {token.currentData.logo && (
                                        <img
                                            src={token.currentData.logo}
                                            alt={token.currentData.symbol}
                                            onClick={() => openImage(token.currentData.logo!)}
                                            style={{ cursor: "pointer", width: 64, height: 64 }}
                                        />
                                    )}
                                </ListItemStats>
                            </LeftColumn>
                            <RightColumn>
                                <MoodBar
                                    className="double"
                                    isMain={true}
                                    score={token?.currentData?.mood?.score || 0}
                                    accuracy={token?.currentData?.mood?.score || 0}
                                    label={token?.currentData?.mood?.label || "Negative"}
                                />
                            </RightColumn>
                        </MainInfoWrapper>
                        {
                            token.isPrivate
                                ?
                                <div className="chart-wrapper">
                                    <NnHistoryChart
                                        data={token?.nnHistory || []}
                                    />
                                </div>
                                :
                                <></>
                        }
                    </ListItem>
                ))}
            </List>

            {modalImage && <ImageModal src={modalImage} onClose={() => openImage('')} />}
            <CreateTradingModal
                accounts={data?.accs || []}
                isVisible={isCreateTrading}
                onClose={() => setIsCreateTrading(false)}
            />
        </Wrapper>
    );
};

export default TrendingTokensAnalytics;
