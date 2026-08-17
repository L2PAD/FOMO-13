import { useState, useContext, useMemo } from "react";
import { useQuery } from "react-query";
import { LoadingContext } from "../components/global/Layout";
import fetchTradingTrends from "../http/trading/fetchTradingTrends";
import { ITradingData } from "../types/global_types";

const useTrendingTokens = (type: 'public' | 'private') => {
    const { loadingStateHandler } = useContext(LoadingContext);

    const [filterValue, setFilterValue] = useState<'all' | 'up' | 'down'>('all');
    const [openItems, setOpenItems] = useState<number[]>([]);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [hiddenTokens, setHiddenTokens] = useState<ITradingData[]>([]);
    const [actionModalId, setActionModalId] = useState<string | null>(null);
    const [itemToEdit, setItemToEdit] = useState<ITradingData | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ITradingData | null>(null);

    const { data: tokensData = [], refetch, isLoading } = useQuery(
        ["trading-tokens", type, filterValue],
        async () => {
            loadingStateHandler(true);
            const res = await fetchTradingTrends(type);
            loadingStateHandler(false);
            return res.tradings || [];
        },
        {
            refetchInterval: 60 * 1000,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        }
    );

    const filteredTokens = useMemo(() => {
        if (!tokensData.length) return [];

        let filtered = tokensData;

        if (filterValue === 'up') {
            filtered = filtered.filter(t => t.currentData.neuralNetworkPrediction.probabilityUp >= 0.5);
        } else if (filterValue === 'down') {
            filtered = filtered.filter(t => t.currentData.neuralNetworkPrediction.probabilityUp < 0.5);
        }

        // Исключаем скрытые токены
        return filtered.filter(t => !hiddenTokens.some(h => h._id === t._id));
    }, [tokensData, filterValue, hiddenTokens]);

    const toggleItem = (index: number) => {
        setOpenItems(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const openImage = (src: string) => setModalImage(src);

    const toggleTokenVisibility = (token: ITradingData) => {
        if (hiddenTokens.some(t => t._id === token._id)) {
            setHiddenTokens(prev => prev.filter(t => t._id !== token._id));
        } else {
            setHiddenTokens(prev => [token, ...prev]);
        }
    };

    return {
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
    };
};

export default useTrendingTokens;
