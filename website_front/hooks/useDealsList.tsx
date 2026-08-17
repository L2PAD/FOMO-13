import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "react-query";
import { toast } from 'react-toastify'
import { AuthContext, LoadingContext } from "../components/global/Layout";
import { IDeal, IUser } from "../types/global_types";
import {
    approveUSDC,
    completeDealETH,
    completeDealUSD,
    createDealWithApproval,
    purchaseDirectETH,
    purchaseDirectUSD,
    safeMoneyETH,
    safeMoneyUSD,
} from "../smart/smartOTCP2P";
import dealAction from "../http/otc/dealAction";
import fetchDeals from "../http/otc/fetchDeals";
import getDealById from "../http/deals/getDealById";
import getDealsStatusesByIds from "../http/deals/getDealsStatusesByIds";
import { buildP2PSettingsQueryString, buildQueryString } from "../utils/otcQueryBuilder";
import { getDealType } from "../hooks/useOtc";
import { ISettingsP2P, P2PActionHandlerVariants } from "../components/layouts/projects/OTC/DealsList";
import { usePromotedDeal } from "./usePromoteDeal";
import { IBuyModalStep } from "../components/layouts/projects/modals/P2PBuyModal/types";

// ============================================================================
// Types
// ============================================================================

export type DealSortTypes = "newest" | "oldest" | "reactions-desc" | "all";

export type ActionHandlerVariants =
    | "block"
    | "start"
    | "reject"
    | "finish"
    | "contact"
    | "share"
    | "create"
    | "reserve"
    | "review"
    | "like"
    | "dislike"
    | "buy"
    | "repeat"
    | "sell"
    | "pin"
    | "confirmSell"
    | "unpin"
    | "chat";

interface UseDealsListProps {
    settingsP2P: ISettingsP2P;
    searchValue: string;
    sortBy?: DealSortTypes;
    type: "buy" | "sell" | "all";
    isMyDeals?: boolean;
    activeTab: any;
    limit: number;
    filters: any;
    isP2p?: boolean;
    setLimit: (value: number) => void;
}

export const DEALS_PAGE_VALUE = 10;
const DEALS_STATUS_CHECK_INTERVAL_MS = 5000;

type DealStatusSnapshot = {
    _id: string;
    status: string;
    isAppeal?: boolean;
    isReservedFunds?: boolean;
    isMakePayment?: boolean;
    isCompleteByAdmin?: boolean;
    lastStatusUpdate?: string | Date;
};

const normalizeDateTime = (value?: string | Date): number => {
    if (!value) {
        return 0;
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const hasDealStatusChanged = (localDeal: IDeal, remoteDeal: DealStatusSnapshot): boolean => {
    return (
        String(localDeal.status || "") !== String(remoteDeal.status || "") ||
        Boolean(localDeal.isAppeal) !== Boolean(remoteDeal.isAppeal) ||
        Boolean(localDeal.isReservedFunds) !== Boolean(remoteDeal.isReservedFunds) ||
        Boolean(localDeal.isMakePayment) !== Boolean(remoteDeal.isMakePayment) ||
        Boolean(localDeal.isCompleteByAdmin) !== Boolean(remoteDeal.isCompleteByAdmin) ||
        normalizeDateTime(localDeal.lastStatusUpdate) !== normalizeDateTime(remoteDeal.lastStatusUpdate)
    );
};

// ============================================================================
// Toast Messages
// ============================================================================

const showSuccessToast = (title: string, message: string) => {
    toast.success(
        <div>
            <h3>{title}</h3>
            {message && <p>{message}</p>}
        </div>
    );
};

const showErrorToast = (title: string = "Error!", message: string = "Not enough funds in your wallet or the deal is already closed") => {
    toast.error(
        <div>
            <h3>{title}</h3>
            {message && <p>{message}</p>}
        </div>
    );
};

// ============================================================================
// Main Hook
// ============================================================================

export const useDealsList = ({
    settingsP2P,
    sortBy,
    type,
    isMyDeals,
    activeTab,
    limit,
    filters,
    isP2p,
    searchValue,
    setLimit,
}: UseDealsListProps) => {
    // Context
    const { userData } = useContext(AuthContext);
    const { loadingStateHandler } = useContext(LoadingContext);

    const buildDealsQueryString = () =>
        isP2p
            ? buildP2PSettingsQueryString(
                settingsP2P,
                searchValue,
                10,
                (limit - 1) * 10,
                isMyDeals,
                filters
            )
            : buildQueryString(
                { ...filters, ...settingsP2P, searchValue },
                sortBy,
                10,
                (limit - 1) * 10,
                isMyDeals
            );

    // Query state
    const [queryString, setQueryString] = useState<string>(() => buildDealsQueryString());
    const sharedDealId = filters?.dealId as string | undefined;

    // Deal data state
    const [dealData, setDealData] = useState<IDeal | null>(null);
    const [p2pDealData, setP2PDealData] = useState<IDeal | null>(null);
    const [contactData, setContactData] = useState<IUser | null>(null);
    const [openOffers, setOpenOffers] = useState<Array<string>>([]);
    const [isApprove, setIsApprove] = useState<boolean>(false);

    // Modal states
    const [isBlockModal, setIsBlockModal] = useState<boolean>(false);
    const [isFinishModal, setIsFinishModal] = useState<boolean>(false);
    const [isReviewModal, setIsReviewModal] = useState<boolean>(false);
    const [offerModal, setOfferModal] = useState(false);
    const [contactModal, setContactModal] = useState(false);
    const [shareModal, setShareModal] = useState(false);
    const [dealModal, setDealModal] = useState(false);
    const [isRepeatCreateDealModal, setIsRepeatCreateDealModal] = useState(false);
    const [chatUserId, setChatUserId] = useState<string>('');
    const [chatId, setChatId] = useState<string>('');
    const [isChatModal, setIsChatModal] = useState(false);

    // P2P modal states
    const [buyModal, setBuyModal] = useState(false);
    const [buyModalStep, setBuyModalStep] = useState<IBuyModalStep | ''>('');

    // Promoted deal
    const { promotedDeal, isLoading: promotedLoading, refetch: refetchPromote, updatePromotedDeal } = usePromotedDeal(isP2p ? 'p2p' : 'otc');

    // ========================================================================
    // Data Fetching
    // ========================================================================

    const {
        isLoading: isListLoading,
        data: listData,
        refetch: refetchDeals,
    } = useQuery(
        ["deals", isP2p, activeTab, queryString],
        () =>
            queryString === "comments"
                ? fetchDeals(
                    "all/comments",
                    `?limit=${DEALS_PAGE_VALUE}&offset=${(limit - 1) * DEALS_PAGE_VALUE
                    }`
                )
                : fetchDeals(
                    getDealType(activeTab),
                    !queryString
                        ? `?limit=${DEALS_PAGE_VALUE}&offset=${(limit - 1) * DEALS_PAGE_VALUE
                        }&sortField=${isP2p ? "price-asc" : "newest"}`
                        : queryString, isP2p ? 'p2p' : 'otc'
                ),
        {
            refetchInterval: 30 * 1000,
            refetchOnWindowFocus: false,
            enabled: !sharedDealId,
        }
    );

    const {
        isLoading: isSingleLoading,
        data: singleDealData,
        refetch: refetchSingleDeal,
    } = useQuery(
        ["deal", sharedDealId, isP2p],
        () => getDealById(sharedDealId || ""),
        {
            enabled: !!sharedDealId,
            refetchOnWindowFocus: false,
        }
    );

    const isLoading = sharedDealId ? isSingleLoading : isListLoading;
    const data = sharedDealId
        ? {
            deals: singleDealData?.deal ? [singleDealData.deal] : [],
            total: singleDealData?.deal ? 1 : 0,
        }
        : listData;

    const refetch = useCallback(
        async ({ skipPromoted }: { skipPromoted?: boolean } = {}) => {
            if (sharedDealId) {
                await refetchSingleDeal();
            } else {
                await refetchDeals();
            }

            if (!skipPromoted) {
                await refetchPromote();
            }
        },
        [sharedDealId, refetchSingleDeal, refetchDeals, refetchPromote]
    );

    const deals: Array<IDeal> = sharedDealId
        ? (singleDealData?.deal ? [singleDealData.deal] : [])
        : (listData?.deals || []);

    const dealsRef = useRef<Array<IDeal>>([]);
    const isLoadingRef = useRef<boolean>(false);

    useEffect(() => {
        dealsRef.current = deals;
    }, [deals]);

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        if (sharedDealId || queryString === "comments") {
            return;
        }

        const interval = setInterval(async () => {
            if (isLoadingRef.current) {
                return;
            }

            const visibleDeals = dealsRef.current || [];
            if (!visibleDeals.length) {
                return;
            }

            const ids = visibleDeals
                .map((deal) => String(deal?._id || ""))
                .filter(Boolean);

            if (!ids.length) {
                return;
            }

            const { isSuccess, deals: statusDeals } = await getDealsStatusesByIds(ids);

            if (!isSuccess || !Array.isArray(statusDeals) || !statusDeals.length) {
                return;
            }

            const remoteById = new Map<string, DealStatusSnapshot>();
            statusDeals.forEach((deal) => {
                if (deal?._id) {
                    remoteById.set(String(deal._id), deal);
                }
            });

            const changed = visibleDeals.some((deal) => {
                const remoteDeal = remoteById.get(String(deal._id));
                if (!remoteDeal) {
                    return false;
                }

                return hasDealStatusChanged(deal, remoteDeal);
            });

            if (changed) {
                await refetch({ skipPromoted: true });
            }
        }, DEALS_STATUS_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [sharedDealId, queryString, refetch]);

    // ========================================================================
    // Smart Contract Actions
    // ========================================================================

    const approveUsd = useCallback(async (): Promise<void> => {
        loadingStateHandler(true);

        const { ok } = await approveUSDC(dealData?.price || 0);

        if (!ok) {
            showErrorToast("Approve error!", "Not enough funds in your wallet");
        }

        setIsApprove(true);

        loadingStateHandler(false);
    }, [dealData?.price, loadingStateHandler]);

    const confirmRealAssetPurchase = useCallback(async (): Promise<void> => {
        if (!dealData) return;

        loadingStateHandler(true);

        const { ok } =
            dealData?.ticker?.toLowerCase() === "eth"
                ? await purchaseDirectETH(dealData.dealId, {
                    price: dealData.price,
                    useInternal: false,
                })
                : await purchaseDirectUSD(dealData.dealId, { useInternal: false });

        if (ok) {
            await dealAction("close", dealData._id);
            showSuccessToast(
                "Deal Completed Successfully!",
                "The transaction has been processed and the assets have been transferred to your wallet."
            );
            refetch();
        } else {
            showErrorToast();
        }

        setDealModal(false);
        setDealData(null);
        loadingStateHandler(false);
    }, [dealData, loadingStateHandler, refetch]);

    const confirmBuy = useCallback(async (): Promise<void> => {
        if (!dealData) return;

        if (dealData.isRealAsset) {
            await confirmRealAssetPurchase();
            return;
        }

        loadingStateHandler(true);

        const { ok } =
            dealData?.ticker?.toLowerCase() === "eth"
                ? await safeMoneyETH(dealData.dealId, {
                    price: dealData.price,
                    useInternal: false,
                })
                : await safeMoneyUSD(dealData.dealId, {
                    price: dealData.price,
                    useInternal: false,
                });

        if (ok) {
            await dealAction("reserve", dealData._id);
            showSuccessToast(
                "Fine!",
                "An SMS was sent to the seller stating that you have deposited money in the safe and you can start providing services, you will be notified when the time comes to accept the services."
            );
            refetch();
        } else {
            showErrorToast();
        }

        setDealModal(false);
        setDealData(null);
        loadingStateHandler(false);
    }, [dealData, confirmRealAssetPurchase, loadingStateHandler, refetch]);

    const confirmP2PReserveFunds = useCallback(async (): Promise<void> => {
        if (!p2pDealData) return;

        loadingStateHandler(true);

        const { ok } =
            p2pDealData?.ticker?.toLowerCase() === "eth"
                ? await safeMoneyETH(p2pDealData.dealId, {
                    price: p2pDealData.amount,
                    useInternal: true,
                })
                : await safeMoneyUSD(p2pDealData.dealId, {
                    price: p2pDealData.amount,
                    useInternal: true,
                });

        if (ok) {
            await dealAction("reserve", p2pDealData._id);
            showSuccessToast(
                "Funds Reserved!",
                "The crypto has been secured in the smart contract. The buyer can now proceed with the payment."
            );

            const updatedDeal = await getDealById(p2pDealData._id);
            if (updatedDeal?.isSuccess && updatedDeal?.deal) {
                setP2PDealData(updatedDeal.deal);
            }

            refetch();
        } else {
            showErrorToast();
        }

        loadingStateHandler(false);
    }, [p2pDealData, loadingStateHandler, refetch, setP2PDealData]);

    const confirmP2PMarkPayment = useCallback(async (): Promise<void> => {
        if (!p2pDealData) return;

        loadingStateHandler(true);

        const { isSuccess } = await dealAction("mark-payment", p2pDealData._id);

        if (isSuccess) {
            showSuccessToast(
                "Payment Notification Sent!",
                "The seller has been notified about your payment. Please wait for confirmation."
            );

            const updatedDeal = await getDealById(p2pDealData._id);
            if (updatedDeal?.isSuccess && updatedDeal?.deal) {
                setP2PDealData(updatedDeal.deal);
                setBuyModalStep('releasing');
            }

            refetch();
        } else {
            showErrorToast("Failed to notify seller", "Please try again");
        }

        loadingStateHandler(false);
    }, [p2pDealData, loadingStateHandler, refetch, setP2PDealData]);

    // ========================================================================
    // Deal Actions
    // ========================================================================

    const confirmBlock = useCallback(async (): Promise<void> => {
        if (!dealData) return;

        loadingStateHandler(true);

        const { isSuccess } = await dealAction("block", dealData._id);

        if (isSuccess) {
            showSuccessToast("Your offer has been sent!", "Wait for confirmation from the seller");
            refetch();
        } else {
            showErrorToast();
        }

        setIsBlockModal(false);
        setDealData(null);

        loadingStateHandler(false);
    }, [dealData, loadingStateHandler, refetch]);

    const confirmFinish = useCallback(
        async (deal: IDeal) => {
            loadingStateHandler(true);

            const { ok }: { ok: boolean } =
                deal.ticker.toLowerCase() === "eth"
                    ? await completeDealETH(deal.dealId)
                    : await completeDealUSD(deal.dealId);

            if (ok) {
                await dealAction("close", deal._id);
                refetch();
            }

            loadingStateHandler(false);
        },
        [loadingStateHandler, refetch]
    );

    const updatePinStatus = useCallback(
        async (dealId: string, status: "pin" | "unpin") => {
            await dealAction(status, dealId, "POST");

            if (promotedDeal?._id === dealId) {
                updatePromotedDeal((prev) => ({
                    ...prev,
                    isPinned: status === "pin",
                }));
            }

            await refetch();
        },
        [refetch, promotedDeal?._id, updatePromotedDeal]
    );

    const blockActionHandler = useCallback(
        async (action: "confirm" | "reject", item: IDeal): Promise<void> => {
            loadingStateHandler(true);

            const { isSuccess } = await dealAction("block", `${action}/${item._id}`);

            if (isSuccess) {
                const title = action === "confirm" ? "Your offer has been sent!" : "Success!";
                showSuccessToast(title, "You have cancelled the offer!");
                refetch();
            } else {
                showErrorToast();
            }

            setDealData(null);

            loadingStateHandler(false);
        },
        [loadingStateHandler, refetch]
    );

    const selectFeedbackAction = useCallback(
        async (action: "like" | "dislike", text: string, targetDealId?: string): Promise<void> => {
            const dealId = targetDealId || dealData?._id || p2pDealData?._id;
            if (!dealId) {
                return;
            }

            loadingStateHandler(true);

            const { isSuccess } = await dealAction(
                "feedback",
                `${action}/${dealId}`,
                "PUT",
                { text }
            );

            if (isSuccess) {
                showSuccessToast("Thanks for leaving a comment!", "");
                refetch();
            }

            setIsReviewModal(false);
            loadingStateHandler(false);
        },
        [dealData?._id, p2pDealData?._id, loadingStateHandler, refetch]
    );

    // ========================================================================
    // UI State Actions
    // ========================================================================

    const updateOpenOffers = useCallback((offer: IDeal): void => {
        setOpenOffers((prev: Array<string>) => {
            if (prev.includes(offer._id)) {
                return prev.filter((id: string) => id !== offer._id);
            }

            return [...prev, offer._id];
        });
    }, []);

    const currentUserId = userData?._id ? String(userData._id) : "";

    const updateDealReaction = useCallback(
        async (item: IDeal, action: "like" | "dislike"): Promise<void> => {
            await dealAction(`reaction`, `${action}/${item._id}`, "PATCH");

            if (promotedDeal?._id === item._id && currentUserId) {
                updatePromotedDeal((prev) => {
                    const likesSet = new Set((prev.likes || []).map(String));
                    const dislikesSet = new Set((prev.dislikes || []).map(String));

                    likesSet.delete(currentUserId);
                    dislikesSet.delete(currentUserId);

                    if (action === "like") {
                        likesSet.add(currentUserId);
                    } else {
                        dislikesSet.add(currentUserId);
                    }

                    return {
                        ...prev,
                        likes: Array.from(likesSet),
                        dislikes: Array.from(dislikesSet),
                    };
                });
            }

            await refetch({ skipPromoted: promotedDeal?._id === item._id });
        },
        [refetch, promotedDeal?._id, currentUserId, updatePromotedDeal]
    );

    const confirmSell = useCallback(
        async (dealData: IDeal): Promise<void> => {
            loadingStateHandler(true);

            const { id, success } = await createDealWithApproval({
                endTime: new Date(dealData.date).getTime() / 1000,
                price: dealData.price,
                currency: dealData.ticker.toLowerCase() === "eth" ? 0 : 1,
                mode: dealData.isRealAsset ? 0 : 1,
                tokenAmount: dealData.isRealAsset ? dealData.amount : 0,
                tokenForSale: dealData.isRealAsset ? dealData.smartContract : "",
                decimals: dealData.isRealAsset ? dealData.decimals || 18 : 0,
            });

            if (!success) {
                toast.error("Smart contract error!");
                loadingStateHandler(false);
                return;
            }

            await dealAction("confirm/sell", dealData._id, "PATCH", { dealId: id });
            await refetch();
            loadingStateHandler(false);
        },
        [loadingStateHandler, refetch]
    );

    // ========================================================================
    // Action Handlers Map
    // ========================================================================

    const dealActionsHandler = useCallback(
        async (actionType: ActionHandlerVariants, item: IDeal): Promise<void> => {
            type ActionExecutor = () => void | Promise<void>;

            // Modal-opening actions
            const modalActions: Record<string, ActionExecutor> = {
                block: () => {
                    setDealData(item);
                    setIsBlockModal(true);
                },
                finish: () => {
                    setDealData(item);
                    setIsFinishModal(true);
                },
                contact: () => {
                    setContactData(item.creator);
                    setContactModal(true);
                },
                share: () => {
                    setDealData(item);
                    setShareModal(true);
                },
                create: () => {
                    setDealData(item);
                    setOfferModal(true);
                },
                reserve: () => {
                    setDealData(item);
                    setDealModal(true);
                },
                review: () => {
                    setDealData(item);
                    setIsReviewModal(true);
                },
                repeat: () => {
                    setDealData(item);
                    setIsRepeatCreateDealModal(true);
                },
                chat: () => {
                    setChatUserId(item.creator?._id || item.buyer?._id || item.seller?._id || '');
                    setChatId(item.chatId || '');
                    setDealData(item);
                    setIsChatModal(true);
                },
            };

            // Direct API actions
            const directActions: Record<string, ActionExecutor> = {
                start: () => blockActionHandler("confirm", item),
                reject: () => blockActionHandler("reject", item),
                like: () => updateDealReaction(item, "like"),
                dislike: () => updateDealReaction(item, "dislike"),
                pin: () => updatePinStatus(item._id, "pin"),
                unpin: () => updatePinStatus(item._id, "unpin"),
                confirmSell: () => confirmSell(item),
            };

            // P2P-specific actions
            const p2pActions: Record<string, ActionExecutor> = {
                buy: () => {
                    if (isP2p) {
                        setP2PDealData(item);
                        setBuyModalStep('buy');
                        setBuyModal(true);
                        return;
                    }
                    setDealData(item);
                    setDealModal(true);
                },
                sell: () => {
                    if (isP2p) {
                        setP2PDealData(item);
                        setBuyModalStep(item.type === "buy" ? "sell" : "make-payment");
                        setBuyModal(true);
                        return;
                    }
                    setDealData(item);
                    setDealModal(true);
                },
            };

            // Combine and execute
            const allActions: Record<string, ActionExecutor> = { ...modalActions, ...directActions, ...p2pActions };
            const method = allActions[actionType];

            if (method) {
                await method();
            }
        },
        [
            blockActionHandler,
            updateDealReaction,
            updatePinStatus,
            isP2p,
            confirmSell,
        ]
    );

    const p2pDealActionsHandler = useCallback(
        async (action: P2PActionHandlerVariants, item: IDeal): Promise<void> => {
            if (action === 'details') {
                const isSeller = item.seller?.wallet === userData?.wallet || item.creator?.wallet === userData?.wallet && type === 'sell';
                const isBuyer = item.buyer?.wallet === userData?.wallet;
                const dealType = item.type;

                if (isBuyer && dealType === 'buy') {
                    setP2PDealData(item);
                    if (item.status === 'ended') {
                        setBuyModalStep('completed');
                    } else if (item.isAppeal) {
                        setBuyModalStep('appeal');
                    } else if (item.status === 'started') {
                        setBuyModalStep('make-payment');
                    }
                    else if (item.isReservedFunds || item.isMakePayment) {
                        setBuyModalStep('make-payment');
                    } else {
                        setBuyModalStep('sell');
                    }
                    setBuyModal(true);
                    return;
                }

                // Creator view for buy deals
                if (item.creator?.wallet === userData?.wallet && dealType === 'buy') {
                    setP2PDealData(item);
                    setBuyModalStep('make-payment');
                    setBuyModal(true);
                    return
                }
                if (isBuyer && dealType === 'sell' && item.isMakePayment && item.status !== 'ended') {
                    setP2PDealData(item);
                    setBuyModalStep('releasing');
                    setBuyModal(true);
                    return
                }

                if ((isBuyer || isSeller) && dealType === 'sell' && item.status === 'ended') {
                    setP2PDealData(item);
                    setBuyModalStep('completed');
                    setBuyModal(true);
                    return
                }

                if (isBuyer && dealType === 'sell') {
                    setP2PDealData(item);
                    setBuyModalStep('make-payment');
                    setBuyModal(true);
                    return
                }

                if (isSeller && dealType === 'sell') {
                    setP2PDealData(item);
                    setBuyModalStep('make-payment');
                    setBuyModal(true);
                    return
                }
            }
        },
        [userData, type]
    );

    // ========================================================================
    // Query String Effect
    // ========================================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setQueryString(buildDealsQueryString());
        }, 600);

        return () => clearTimeout(timer);
    }, [isP2p, settingsP2P, filters, searchValue, sortBy, limit, isMyDeals]);

    // ========================================================================
    // Helper Functions
    // ========================================================================

    const getDealItemProps = useCallback(
        (isMyDealsProps: boolean) => ({
            dealActionsHandler,
            userData,
            confirmCompleteDeal: confirmFinish,
            isMyDealProps: isMyDealsProps,
            isP2p: isP2p || false,
            onChatOpen: (chatRef: string) => {
                if (typeof chatRef === 'string' && chatRef.startsWith('chat:')) {
                    setChatId(chatRef.replace('chat:', ''));
                    setChatUserId('');
                } else {
                    setChatUserId(chatRef);
                    setChatId('');
                }
                setIsChatModal(true);
            },
        }),
        [dealActionsHandler, userData, confirmFinish, isP2p, setChatUserId, setChatId, setIsChatModal]
    );

    // ========================================================================
    // Return Values
    // ========================================================================

    return {
        // Data
        queryString,
        searchValue,
        deals,
        isLoading,
        data,
        dealData,
        p2pDealData,
        contactData,
        promotedDeal,
        promotedLoading,
        chatUserId,
        chatId,

        // Modal states
        isChatModal,
        isApprove,
        isBlockModal,
        isFinishModal,
        isReviewModal,
        openOffers,
        buyModal,
        offerModal,
        contactModal,
        shareModal,
        dealModal,
        isRepeatCreateDealModal,
        buyModalStep,

        // State setters
        refetchPromote,
        setDealData,
        setP2PDealData,
        setContactData,
        setIsApprove,
        setIsBlockModal,
        setIsFinishModal,
        setIsReviewModal,
        setOpenOffers,
        setBuyModal,
        setBuyModalStep,
        setOfferModal,
        setContactModal,
        setShareModal,
        setDealModal,
        setIsRepeatCreateDealModal,
        setIsChatModal,
        setChatUserId,
        setChatId,

        // Actions
        approveUsd,
        confirmRealAssetPurchase,
        confirmBuy,
        confirmP2PReserveFunds,
        confirmP2PMarkPayment,
        confirmBlock,
        confirmFinish,
        updatePinStatus,
        blockActionHandler,
        selectFeedbackAction,
        updateOpenOffers,
        updateDealReaction,
        confirmSell,
        dealActionsHandler,
        p2pDealActionsHandler,
        getDealItemProps,

        // Refetch
        refetch,
    };
};
