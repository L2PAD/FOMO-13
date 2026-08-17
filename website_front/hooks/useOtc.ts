import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../components/global/Layout";
import { DealSortTypes } from "../components/layouts/projects/OTC/DealsList";
import { TopMembersSortBy } from "../components/layouts/projects/OTC/TopMembers";
import { sortByValues, SortP2PType } from "../components/global/Filter/p2p_settings";

export const DealTypes = {
  buy: "Buying",
  sell: "Selling",
};

export const sortByItems = [
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
]

export const tabs = ["Buy", "Sell", "Top members", "My deals"];

export const mainTabs = [
  {
    name: "Buy",
    key: "buy"
  },
  {
    name: "Sell",
    key: "sell"
  },
  {
    name: "Top members",
    key: "top-members"
  },
  {
    name: "My deals",
    key: "my-deals"
  }
];

export const topMembersTabs = [
  {
    name: "All",
    key: "all"
  },
  {
    name: "Top Deals",
    key: "deals-desc"
  },
  {
    name: "Top Sells",
    key: "sales-desc"
  },
  {
    name: "Top Purchases",
    key: "purchases-desc"
  }
];

export const myDealTabs = [
  {
    name: "All",
    key: "all"
  },
  {
    name: "My Purchases",
    key: "my-purchases"
  },
  {
    name: "My Sells",
    key: "my-sells"
  }
];

export const getDealType = (
  value: string
): "buy" | "sell" | "all" | "all/members" => {
  switch (value) {
    case "Buy":
      return "buy";
    case "Sell":
      return "sell";
    case "My deals":
      return "all";
    case "Top members":
      return "all/members";
    default:
      return "all";
  }
};

export const useOtcState = () => {
  const router = useRouter();
  const [pageVariant, setPageVariant] = useState<"otc" | "p2p">("otc");
  const [filterValue, setFilterValue] = useState<any>("all");
  const [sortBy, setSortBy] = useState<{
    deals: DealSortTypes,
    members: TopMembersSortBy
  }>({ deals: 'newest', members: 'all' });
  const [sortByP2P, setSortByP2P] = useState<SortP2PType>({ name: "Price (low to high)", key: 'price-asc' });
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [limit, setLimit] = useState<number>(1);
  const [modal, setModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<any>();
  const [parsedDealId, setParsedDealId] = useState<string | null>(null);

  const clearFocusedItem = () => {
    setParsedDealId(null);
    document.querySelectorAll('.deal-highlighted').forEach(el => {
      el.classList.remove('deal-highlighted');
    });
    setFilters((prev: any) => {
      if (!prev) return {};
      const next = { ...prev };
      delete next.dealId;
      delete next.memberId;
      return next;
    });
  };

  const highlightElement = (idParam: string, itemType: "deal" | "member") => {
    const maxAttempts = 20;
    const attemptDelayMs = 500;

    const tryHighlight = (attempt: number) => {
      const itemElement: any = document.querySelector(`#item-${idParam}`);

      if (itemElement) {
        document.querySelectorAll('.deal-highlighted').forEach(el => {
          el.classList.remove('deal-highlighted');
        });

        itemElement.classList.add('deal-highlighted');

        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        const handleDocumentClick = (event: MouseEvent) => {
          if (itemElement.contains(event.target as Node)) {
            return;
          }

          itemElement.classList.remove('deal-highlighted');
          clearFocusedItem();
          document.removeEventListener('click', handleDocumentClick);
        };

        document.addEventListener('click', handleDocumentClick);
      } else {
        if (attempt < maxAttempts) {
          setTimeout(() => tryHighlight(attempt + 1), attemptDelayMs);
        } else {
          console.warn(`Deal element with ID deal-${idParam} not found`);
        }
      }
    };

    setTimeout(() => {
      tryHighlight(0);
    }, 200);
  };

  const parseUrlParams = () => {
    const { query, pathname } = router;
    const tabParam = query.tab as string;
    const idParam = query.id as string;
    const sectionParam = query.section as string;

    if (sectionParam === "p2p") {
      setPageVariant("p2p");
    } else if (sectionParam === "otc") {
      setPageVariant("otc");
    }

    let nextTab = activeTab;

    if (tabParam) {
      const formattedTab =
        tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();

      if (tabs.includes(formattedTab)) {
        nextTab = formattedTab;
        setActiveTab(formattedTab);
      }
    }

    if (idParam) {
      const isMember = nextTab === "Top members";
      const itemType: "deal" | "member" = isMember ? "member" : "deal";
      setParsedDealId(idParam);
      setFilters((prev: any) => ({
        ...(prev || {}),
        ...(isMember ? { memberId: idParam } : { dealId: idParam }),
      }));
      highlightElement(idParam, itemType);
    }


  }

  const resetFilters = () => {
    setSortBy({ deals: 'newest', members: 'all' })
    setFilterValue('all')
    setSearchValue('')
    setSortByP2P({ name: "Price (low to high)", key: 'price-asc' })
  }

  const updateActiveTab = (value: string) => {
    const query: any = { tab: value.toLowerCase() };

    router.push("", { query }, { shallow: true });
    setActiveTab(value);
    clearFocusedItem();
    resetFilters()
    setLimit(1);
  };

  const handleUpdatePageVariant = (value: "otc" | "p2p") => {
    setPageVariant(value);
    router.push("", { query: {} }, { shallow: true });
    clearFocusedItem();
    resetFilters()
    setLimit(1);
  };

  useEffect(() => {
    parseUrlParams();
  }, [router.query]);

  useEffect(() => {
    if (router.isReady) {
      parseUrlParams();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady || router.pathname !== "/utility") {
      return;
    }

    const id = router.query.id;
    const tab = router.query.tab;
    const section = router.query.section;
    if (!id && !tab && !section) {
      return;
    }

    const restQuery = { ...router.query };
    delete restQuery.id;
    delete restQuery.tab;
    delete restQuery.section;

    const timer = setTimeout(() => {
      if (router.pathname !== "/utility") {
        return;
      }

      router.replace(
        { pathname: router.pathname, query: restQuery },
        undefined,
        { shallow: true }
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [router.isReady, router.pathname, router.query.id, router.query.tab, router.query.section]);

  const availableFilterTabs = useMemo(() => {
    switch (activeTab) {
      case "Buy":
      case "Sell":
        return sortByItems;
      case "Top members":
        return topMembersTabs;
      case "My deals":
        return myDealTabs;
    }
    return []
  }, [activeTab]);

  const p2pFilterTabs = ["All", "ETH", "USDC"];

  return {
    filterValue,
    setFilterValue,
    activeTab,
    setActiveTab,
    limit,
    setLimit,
    pageVariant,
    handleUpdatePageVariant,
    modal,
    setModal,
    searchValue,
    setSearchValue,
    filters,
    setFilters,
    updateActiveTab,
    availableFilterTabs,
    p2pFilterTabs,
    parsedDealId,
    setParsedDealId,
    sortBy,
    setSortBy,
    sortByP2P,
    setSortByP2P
  };
};
