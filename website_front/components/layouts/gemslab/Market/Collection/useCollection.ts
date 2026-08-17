import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { ICollection, ISocialMediaItem } from "../../../../../types/global_types";
import {
    AuthContext,
    LocationContext,
    WatchlistContext,
} from "../../../../global/Layout";
import {
    getCollectionData,
    getOwnerCount,
} from "../../../../../smart/initialSmartMarketplace";
import { IPriceData } from "../Project";
import { CollectionFlagColor } from "./components/CollectionHeaderActions";
import addProjectToWatchlist from "../../../../../http/watchlist/addProjectToWatchlist";
import deleteFromWatchlist from "../../../../../http/watchlist/deleteFromWatchlist";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import addCollectionReaction from "../../../../../http/collections/addCollectionReaction";
import toggleCollectionFlag from "../../../../../http/collections/toggleCollectionFlag";
import addCollectionView from "../../../../../http/collections/addCollectionView";
import {
    COLLECTION_MARKET_FILTER_DEFAULTS,
    ICollectionMarketFilters,
    normalizeCollectionMarketFilters,
} from "../../../../../utils/collectionMarketFilters";
import { useEthUsdPrice } from "../../../../../hooks/useEthUsdPrice";

const ITEMS_PER_PAGE = 20;

const getNftCurrency = (nft: any): "ETH" | "USDC" => {
    if (String(nft?.currency || "").toUpperCase() === "USDC" || nft?.isUsdc) {
        return "USDC";
    }
    return "ETH";
};

const getAttributeValue = (attributes: Array<any> | undefined, names: string[]) => {
    const normalizedNames = names.map((item) =>
        String(item || "").trim().toLowerCase().replace(/[_-]/g, " ")
    );

    const attribute = (attributes || []).find((item) => {
        const traitType = String(item?.trait_type || item?.type || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]/g, " ");

        return normalizedNames.includes(traitType);
    });

    return attribute?.value;
};

const getNftRarity = (nft: any): string => {
    return String(
        nft?.rarity ||
        getAttributeValue(nft?.attributes, ["rarity"]) ||
        "Common"
    ).trim();
};

const getNftRarityRank = (nft: any): number | null => {
    const rankValue =
        nft?.rarityRank ??
        getAttributeValue(nft?.attributes, [
            "rarity rank",
            "rarity_rank",
            "rarityrank",
            "rank",
        ]);

    const matchedValue = String(rankValue ?? "").match(/[0-9]+(?:\.[0-9]+)?/);
    const parsedValue = Number(matchedValue?.[0] || "");

    return Number.isFinite(parsedValue) ? parsedValue : null;
};

const isDefaultRange = (
    current: [number, number],
    defaults: [number, number]
): boolean => {
    return current[0] === defaults[0] && current[1] === defaults[1];
};

const normalizeSocialLinks = (
    socialmedia: any
): Array<{ href: string; key: string }> => {
    const links = new Set<string>();

    const addLink = (value?: string) => {
        if (!value || typeof value !== "string") return;
        const trimmed = value.trim();
        if (!trimmed) return;
        links.add(trimmed);
    };

    if (Array.isArray(socialmedia)) {
        socialmedia.forEach((item: ISocialMediaItem | string) => {
            if (typeof item === "string") {
                addLink(item);
                return;
            }
            addLink(item?.href);
        });
    } else if (socialmedia && typeof socialmedia === "object") {
        Object.values(socialmedia).forEach((entry: any) => {
            if (Array.isArray(entry)) {
                entry.forEach((value) => {
                    if (typeof value === "string") {
                        addLink(value);
                        return;
                    }
                    addLink(value?.href || value?.url);
                });
                return;
            }
            if (typeof entry === "string") {
                addLink(entry);
                return;
            }
            addLink(entry?.href || entry?.url);
        });
    }

    return Array.from(links).map((href) => ({
        href: /^https?:\/\//i.test(href) ? href : `https://${href}`,
        key: getServiceByUrl(href),
    }));
};

export const useCollection = (collection?: ICollection) => {
    const { asPath, query, push: nav, replace } = useRouter();
    const { userData } = useContext(AuthContext);
    const { path } = useContext(LocationContext);
    const { watchlist, refetch: refetchWatchlist } = useContext(WatchlistContext);
    const ethUsdRate = useEthUsdPrice(Number(collection?.marketStats?.ethUsdRate || 0));

    // --- State ---
    const [currency, setCurrency] = useState<"ETH" | "USDC">(
        query.currency === "USDC" ? "USDC" : "ETH"
    );
    const [modal, setModal] = useState(false);
    const [cartModal, setCartModal] = useState(false);
    const [filterValue, setFilterValue] = useState<string>("All");
    const [collectionFilters, setCollectionFilters] = useState<ICollectionMarketFilters>(
        normalizeCollectionMarketFilters(COLLECTION_MARKET_FILTER_DEFAULTS)
    );
    const [interval, setInterval] = useState<string>("7d");
    const [page, setPage] = useState(1);
    const [isShareModal, setIsShareModal] = useState(false);
    const [priceData, setPriceData] = useState<IPriceData>({
        minPrice: 0,
        maxPrice: 0,
        percent: 0,
        marketCap: 0,
        totalVolume: 0,
        supply: 0,
    });

    const [isMobile, setIsMobile] = useState(false);
    const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
    const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [activeFlag, setActiveFlag] = useState<CollectionFlagColor | null>(null);
    const [isInFavorites, setIsInFavorites] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [viewsCount, setViewsCount] = useState(0);
    const [likesCount, setLikesCount] = useState(0);
    const [dislikesCount, setDislikesCount] = useState(0);
    const [ownersCount, setOwnersCount] = useState(0);

    // --- Derived ---
    const collectionId = String(collection?._id || "");
    const projectId = String(collection?.project?._id || "");
    const watchlistPath = path || "utility";
    const allNftItems = Array.isArray(collection?.nfts) ? collection?.nfts || [] : [];

    const filteredNftItems = useMemo(() => {
        const normalizedFilters = normalizeCollectionMarketFilters(collectionFilters);
        const normalizedStatuses = normalizedFilters.status.map((item) =>
            item.toLowerCase()
        );
        const hasListed = normalizedStatuses.includes("listed");
        const hasNotListed = normalizedStatuses.includes("not listed");
        const wantsBuyNow = normalizedStatuses.includes("buy now");
        const wantsRarityRanking = normalizedStatuses.includes("rarity ranking");
        const shouldApplyRarityRange = !isDefaultRange(
            normalizedFilters.rarityRank,
            COLLECTION_MARKET_FILTER_DEFAULTS.rarityRank
        );
        const shouldApplyPriceRange = !isDefaultRange(
            normalizedFilters.priceRange,
            COLLECTION_MARKET_FILTER_DEFAULTS.priceRange
        );

        return allNftItems.filter((nft) => {
            if (getNftCurrency(nft) !== currency) {
                return false;
            }

            const isActive = nft?.isActive !== false;
            const rarity = getNftRarity(nft);
            const rarityRank = getNftRarityRank(nft);
            const price = Number(nft?.price || 0);

            if (hasListed && !hasNotListed && !isActive) {
                return false;
            }

            if (hasNotListed && !hasListed && isActive) {
                return false;
            }

            if (wantsBuyNow && !isActive) {
                return false;
            }

            if (wantsRarityRanking && rarityRank === null) {
                return false;
            }

            if (
                shouldApplyRarityRange &&
                (
                    rarityRank === null ||
                    rarityRank < normalizedFilters.rarityRank[0] ||
                    rarityRank > normalizedFilters.rarityRank[1]
                )
            ) {
                return false;
            }

            if (
                shouldApplyPriceRange &&
                (
                    price < normalizedFilters.priceRange[0] ||
                    price > normalizedFilters.priceRange[1]
                )
            ) {
                return false;
            }

            if (
                normalizedFilters.rarity.length &&
                !normalizedFilters.rarity.includes(rarity)
            ) {
                return false;
            }

            return true;
        });
    }, [allNftItems, collectionFilters, currency]);

    const totalPages = Math.max(1, Math.ceil(filteredNftItems.length / ITEMS_PER_PAGE));

    const paginatedNftItems = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredNftItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredNftItems, page]);

    const socialLinks = useMemo(
        () => normalizeSocialLinks(collection?.project?.socialmedia),
        [collection?.project?.socialmedia]
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isActionsPopoverOpen) {
                const target = event.target as Element;
                if (!target.closest("[data-popover-trigger]")) {
                    setIsActionsPopoverOpen(false);
                }
            }
        };

        if (isActionsPopoverOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isActionsPopoverOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (isActionsPopoverOpen) {
                setIsActionsPopoverOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isActionsPopoverOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSocialsPopoverOpen) {
                const target = event.target as Element;
                if (!target.closest("[data-popover-trigger]")) {
                    setIsSocialsPopoverOpen(false);
                }
            }
        };

        if (isSocialsPopoverOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSocialsPopoverOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (isSocialsPopoverOpen) {
                setIsSocialsPopoverOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isSocialsPopoverOpen]);

    const getNftPriceData = async () => {
        try {
            const data = await getCollectionData(
                collection?.smart || "",
                currency,
                ethUsdRate,
                collection?.project
            );
            const totalVolumeEthUsd = Number(
                (Number(data?.totalVolumeEth || 0) * ethUsdRate).toFixed(2)
            );
            console.log(totalVolumeEthUsd)
            const totalVolumeUsdcUsd = Number(
                Number(data?.totalVolumeUsd || 0).toFixed(2)
            );
            const totalVolume = Number(
                (totalVolumeEthUsd + totalVolumeUsdcUsd).toFixed(2)
            );

            const price =
                currency === "ETH"
                    ? Number(Number(data.minPrice * ethUsdRate).toFixed(2))
                    : data.minPrice;

            const percent =
                Number(data.minPrice || 0) > 0
                    ? ((price - data.minPrice) / data.minPrice) * 100
                    : 0;

            setPriceData({
                minPrice: data.minPrice,
                maxPrice: data.maxPrice,
                percent,
                marketCap: Number(data.marketCap),
                totalVolume,
                supply: Number(data.supply),
            });
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getNftPriceData();
    }, [currency, collection?.smart, collection?.project?._id, ethUsdRate]);

    useEffect(() => {
        let isCancelled = false;

        const syncOwnersCount = async () => {
            if (!collection?.smart || typeof window === "undefined") {
                if (!isCancelled) {
                    setOwnersCount(0);
                }
                return;
            }

            const { success, owners } = await getOwnerCount(collection.smart);

            if (!isCancelled) {
                setOwnersCount(success ? owners.length : 0);
            }
        };

        syncOwnersCount();

        return () => {
            isCancelled = true;
        };
    }, [collection?.smart]);

    useEffect(() => {
        setPage(1);
    }, [collectionFilters, currency]);

    useEffect(() => {
        const collectionLikes = collection?.likes;
        const collectionDislikes = collection?.dislikes;
        const likes: Array<any> = Array.isArray(collectionLikes) ? collectionLikes : [];
        const dislikes: Array<any> = Array.isArray(collectionDislikes)
            ? collectionDislikes
            : [];
        const userId = String(userData?._id || "");

        setLikesCount(likes.length);
        setDislikesCount(dislikes.length);

        if (userId) {
            setIsLiked(likes.some((id: any) => String(id) === userId));
            setIsDisliked(dislikes.some((id: any) => String(id) === userId));
        } else {
            setIsLiked(false);
            setIsDisliked(false);
        }
    }, [collection?.likes, collection?.dislikes, userData?._id]);

    useEffect(() => {
        if (!projectId) {
            setIsInWatchlist(false);
            return;
        }

        setIsInWatchlist(
            !!watchlist?.projects?.find((item: any) => String(item?._id) === projectId)
        );
    }, [watchlist, projectId]);

    useEffect(() => {
        if (typeof window === "undefined" || !collectionId) return;
        if (!userData?.isFullAuth) return;

        const sessionViewKey = `market:collection:${collectionId}:viewed:${String(
            userData?._id || ""
        )}`;
        setViewsCount(Number(collection?.viewsCount || 0));

        if (!window.sessionStorage.getItem(sessionViewKey)) {
            addCollectionView(collectionId).then(({ isSuccess, collection: updated }) => {
                if (isSuccess && updated) {
                    setViewsCount(Number(updated?.viewsCount || 0));
                }
            });
            window.sessionStorage.setItem(sessionViewKey, "1");
        }
    }, [collectionId, collection?.viewsCount, userData?._id, userData?.isFullAuth]);

    useEffect(() => {
        const userId = String(userData?._id || "");
        if (!userId) {
            setActiveFlag(null);
            return;
        }

        if (
            Array.isArray(collection?.greenFlags) &&
            collection?.greenFlags?.some((id) => String(id) === userId)
        ) {
            setActiveFlag("green");
            return;
        }
        if (
            Array.isArray(collection?.yellowFlags) &&
            collection?.yellowFlags?.some((id) => String(id) === userId)
        ) {
            setActiveFlag("yellow");
            return;
        }
        if (
            Array.isArray(collection?.redFlags) &&
            collection?.redFlags?.some((id) => String(id) === userId)
        ) {
            setActiveFlag("red");
            return;
        }

        setActiveFlag(null);
    }, [collection?.greenFlags, collection?.yellowFlags, collection?.redFlags, userData?._id]);


    const copySmartContract = () => {
        navigator.clipboard.writeText(collection?.smart || "");
        toast.success("Smart contract was copied");
    };

    const handleActionsClick = () => {
        setIsActionsPopoverOpen(!isActionsPopoverOpen);
    };

    const closeActionsPopover = () => {
        setIsActionsPopoverOpen(false);
    };

    const handleSocialsClick = () => {
        setIsSocialsPopoverOpen(!isSocialsPopoverOpen);
    };

    const closeSocialsPopover = () => {
        setIsSocialsPopoverOpen(false);
    };

    const handleLike = async () => {
        if (!collectionId) {
            toast.error("Collection is not found");
            return;
        }

        if (!userData?.isFullAuth) {
            toast.error("You need to be fully logged in to like collection");
            return;
        }

        try {
            const { isSuccess, collection: updated } = await addCollectionReaction(
                collectionId,
                "like"
            );

            if (!isSuccess) {
                toast.error("Failed to update like");
                return;
            }

            const likesRaw = updated?.likes;
            const dislikesRaw = updated?.dislikes;
            const likes: Array<any> = Array.isArray(likesRaw) ? likesRaw : [];
            const dislikes: Array<any> = Array.isArray(dislikesRaw) ? dislikesRaw : [];
            const userId = String(userData?._id || "");

            setLikesCount(likes.length);
            setDislikesCount(dislikes.length);
            setIsLiked(likes.some((id: any) => String(id) === userId));
            setIsDisliked(dislikes.some((id: any) => String(id) === userId));

        } catch (error) {
            toast.error("Failed to update like");
        }
    };

    const handleDislike = async () => {
        if (!collectionId) {
            toast.error("Collection is not found");
            return;
        }

        if (!userData?.isFullAuth) {
            toast.error("You need to be fully logged in to dislike collection");
            return;
        }

        try {
            const { isSuccess, collection: updated } = await addCollectionReaction(
                collectionId,
                "dislike"
            );

            if (!isSuccess) {
                toast.error("Failed to update dislike");
                return;
            }

            const likesRaw = updated?.likes;
            const dislikesRaw = updated?.dislikes;
            const likes: Array<any> = Array.isArray(likesRaw) ? likesRaw : [];
            const dislikes: Array<any> = Array.isArray(dislikesRaw) ? dislikesRaw : [];
            const userId = String(userData?._id || "");

            setLikesCount(likes.length);
            setDislikesCount(dislikes.length);
            setIsLiked(likes.some((id: any) => String(id) === userId));
            setIsDisliked(dislikes.some((id: any) => String(id) === userId));

        } catch (error) {
            toast.error("Failed to update dislike");
        }
    };

    const handleFlag = async (color: CollectionFlagColor) => {
        if (!collectionId) return;

        if (!userData?.isFullAuth) {
            toast.error("You need to be fully logged in to set a flag");
            return;
        }

        try {
            const { isSuccess, collection: updated } = await toggleCollectionFlag(
                collectionId,
                color
            );

            if (!isSuccess) {
                toast.error("Failed to update flag");
                return;
            }

            const userId = String(userData?._id || "");
            if (
                Array.isArray(updated?.greenFlags) &&
                updated?.greenFlags?.some((id) => String(id) === userId)
            ) {
                setActiveFlag("green");
            } else if (
                Array.isArray(updated?.yellowFlags) &&
                updated?.yellowFlags?.some((id) => String(id) === userId)
            ) {
                setActiveFlag("yellow");
            } else if (
                Array.isArray(updated?.redFlags) &&
                updated?.redFlags?.some((id) => String(id) === userId)
            ) {
                setActiveFlag("red");
            } else {
                setActiveFlag(null);
            }

        } catch (error) {
            toast.error("Failed to update flag");
        }
    };

    const handleAddToFavorites = () => {
        setIsInFavorites(!isInFavorites);
    };

    const handleWatchlist = async () => {
        if (!projectId) {
            toast.error("Project is not connected to collection");
            return;
        }

        if (!userData?.isFullAuth) {
            toast.error("You need to be fully logged in to add project to watchlist");
            return;
        }

        try {
            if (isInWatchlist) {
                const { success } = await deleteFromWatchlist(watchlistPath, projectId);

                if (!success) {
                    toast.error("Failed to remove from watchlist");
                    return;
                }

                setIsInWatchlist(false);
            } else {
                const { success } = await addProjectToWatchlist(watchlistPath, projectId);

                if (!success) {
                    toast.error("Failed to add to watchlist");
                    return;
                }

                setIsInWatchlist(true);
            }

            if (typeof refetchWatchlist === "function") {
                await refetchWatchlist();
            }
        } catch (error) {
            toast.error("Watchlist update failed");
        }
    };

    const openCartModal = () => setCartModal(true);
    const closeCartModal = () => setCartModal(false);
    const openShareModal = () => setIsShareModal(true);
    const closeShareModal = () => setIsShareModal(false);
    const openMakeOfferModal = () => setModal(true);
    const closeMakeOfferModal = () => setModal(false);

    const navigateToMakeOffer = () => nav(`nft/2643`);

    const handleCheckoutSuccess = async () => {
        await replace(asPath);
    };

    return {
        currency,
        setCurrency,
        modal,
        cartModal,
        filterValue,
        setFilterValue,
        interval,
        setInterval,
        page,
        setPage,
        isShareModal,
        priceData,
        isMobile,
        isActionsPopoverOpen,
        isSocialsPopoverOpen,
        isLiked,
        isDisliked,
        activeFlag,
        isInFavorites,
        isInWatchlist,
        viewsCount,
        likesCount,
        dislikesCount,

        filteredNftItems,
        paginatedNftItems,
        totalPages,
        ownersCount,
        socialLinks,
        setCollectionFilters,

        copySmartContract,
        handleActionsClick,
        closeActionsPopover,
        handleSocialsClick,
        closeSocialsPopover,
        handleLike,
        handleDislike,
        handleFlag,
        handleAddToFavorites,
        handleWatchlist,
        navigateToMakeOffer,
        openCartModal,
        closeCartModal,
        openShareModal,
        closeShareModal,
        openMakeOfferModal,
        closeMakeOfferModal,
        handleCheckoutSuccess,

        ITEMS_PER_PAGE,
    };
};
