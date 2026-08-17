import React, { useState, useEffect, useRef, createContext } from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import Header from '../../components/layouts/users_list_layout/users_list_otc/header';
import UsersTable from '../../components/layouts/users_list_layout/users_list_otc/users_table';
import { useQuery } from 'react-query';
import fetchDeals from '../../components/services/deals/fetchDeals';
import fetchWithdrawItems from '../../components/services/deals/fetchWithdrawItems';
import { IAppeal, IDeal } from '../../components/types/global_types';
import { statusesReverse } from '../../components/layouts/users_list_layout/users_list_otc/users_table/table_row';
import { TabsWrapper } from '../../components/layouts/support_layout/styles';
import Tabs from '../../components/common/tabs';
import WithdrawTable from '../../components/layouts/deals_layout/withdraw_table';
import { useConnectWallet } from '../../components/hooks/useConnectWallet';
import fetchDeposits from '../../components/services/deals/fetchDeposits';
import DepositsTable from '../../components/layouts/deals_layout/deposits_table';
import fetchDealsP2P from '../../components/services/deals/fetchDealsP2P';
import fetchAppeals from '../../components/services/deals/fetchAppeals';
import AppealsTable from '../../components/layouts/users_list_layout/users_list_otc/appeals_table';

export enum DEALS_TABS {
  'OTC' = 'OTC',
  'P2P' = 'P2P',
  'WITHDRAW' = 'WITHDRAW',
  'DEPOSITS' = 'DEPOSITS',
  'APPEALS' = 'APPEALS'
}

export const OtcFilterContext = createContext({
  activeTab: DEALS_TABS.OTC,
  filters: {},
  onFiltersChange: (value: any) => {
    console.log(value)
  },
  searchValue: '',
  onSearchChange: (value: string) => {
    console.log(value)
  },
  sortValue: '',
  onSortChange: (value: string) => {
    console.log(value)
  },
  onReset: () => {
    console.log('reset')
  }
})

export const buildWithdrawQueryString = (
  filters: any,
  searchValue: string,
  page: number,
  limit: number,
) => {
  const params: any = {
    page: page + 1,
    limit: limit || 1,
  };

  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.currency) {
    params.currency = filters.currency;
  }
  if (filters?.userId) {
    params.userId = filters.userId;
  }
  if (searchValue) {
    params.search = searchValue;
  }

  // Добавляем даты если есть в фильтрах
  if (filters?.startDate) {
    params.startDate = filters.startDate.toISOString();
  }
  if (filters?.endDate) {
    params.endDate = filters.endDate.toISOString();
  }

  const queryString = new URLSearchParams(params).toString();
  return `?${queryString}`;
};

export const buildQueryString = (
  activeTab: DEALS_TABS,
  filters: any,
  sortField: string,
  searchValue: string,
  page: number,
  limit = 10,
  isMyDeals?: boolean,
) => {
  const buildAppealsQuery = () => {
    const params: any = {
      limit,
      offset: page * limit,
    };

    if (filters?.status) {
      params.status = filters.status;
    }

    const query = new URLSearchParams(params).toString();
    return `?${query}`;
  };

  const buildOtcP2PQuery = () => {
    const params: any = {
      limit,
      offset: page * limit,
    };

    if (filters?.serviceType) {
      params.serviceType = filters.serviceType;
    }
    if (filters?.userStatus) {
      params.userStatus = filters.userStatus;
    }
    if (filters?.isRealAsset) {
      params.isRealAsset = filters.isRealAsset;
    }
    if (filters?.risk) {
      params.risk = filters.risk;
    }
    if (searchValue) {
      params.searchValue = searchValue;
    }
    if (filters?.startDate) {
      params.startDate = filters.startDate.toISOString();
    }
    if (filters?.endDate) {
      params.endDate = filters.endDate.toISOString();
    }
    if (filters?.priceEth) {
      params.minPriceEth = filters.priceEth[0];
      params.maxPriceEth = filters.priceEth[1];
    }
    if (filters?.priceUsdc) {
      params.minPriceUsdc = filters.priceUsdc[0];
      params.maxPriceUsdc = filters.priceUsdc[1];
    }
    if (filters?.amount) {
      params.minAmount = filters.amount[0];
      params.maxAmount = filters.amount[1];
    }
    if (filters?.rating) {
      params.minRating = filters.rating[0];
      params.maxRating = filters.rating[1];
    }
    if (filters?.tickers) {
      params.tickers = filters.tickers;
    }
    if (sortField) {
      params.sortField = sortField;
    }
    if (isMyDeals) {
      params.userDeals = 'true';
    }

    if (filters?.dealStatus?.length) {
      params.dealStatus = filters.dealStatus.map((item: "Available" | "Wait for confirm" | 'Started' | 'Funds reserved' | 'Ended') => {
        return statusesReverse[item];
      });
    }

    const queryString = new URLSearchParams(params).toString();
    return `?${queryString}`;
  };

  switch (activeTab) {
    case DEALS_TABS.WITHDRAW:
      return buildWithdrawQueryString(filters, searchValue, page, limit);
    case DEALS_TABS.APPEALS:
      return buildAppealsQuery();
    case DEALS_TABS.OTC:
    case DEALS_TABS.P2P:
    default:
      return buildOtcP2PQuery();
  }
};

const tabs: string[] = [
  'OTC',
  'P2P',
  'WITHDRAW',
  'DEPOSITS',
  'APPEALS'
]

const UsersListOTCPage = () => {
  const [activeTab, setActiveTab] = useState<DEALS_TABS>(DEALS_TABS.OTC)
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<IAppeal[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<any>({})
  const [searchValue, setSearchValue] = useState<string>('')
  const [sortValue, setSortValue] = useState<string>('')
  const [queryString, setQueryString] = useState<string>('')
  const limit = 100;
  const { connectWallet } = useConnectWallet()

  const observer = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    switch (activeTab) {
      case DEALS_TABS.WITHDRAW:
        return await fetchWithdrawItems({
          page: page + 1,
          limit,
          status: filters?.status,
          currency: filters?.currency,
          userId: filters?.userId,
          search: searchValue,
        });
      case DEALS_TABS.OTC:
        return await fetchDeals(queryString);
      case DEALS_TABS.P2P:
        return await fetchDealsP2P('?limit=100&offset=0&sort=newest');
      case DEALS_TABS.DEPOSITS:
        return await fetchDeposits({
          page: page + 1,
          limit
        })
      case DEALS_TABS.APPEALS:
        return await fetchAppeals(queryString);
      default:
        return await fetchDeals(queryString);
    }
  };

  const { refetch, isFetching } = useQuery(
    ['users-list', queryString, activeTab, page],
    fetchData,
    {
      onSuccess: (data) => {
        if (activeTab === DEALS_TABS.WITHDRAW) {
          const newWithdraws = data?.data?.data || data?.data || [];
          setWithdraws(newWithdraws);
          setTotal(data?.data?.total || data?.data?.length || 0);
          setDeals([]);
          setDeposits([])
        } else if (activeTab === DEALS_TABS.DEPOSITS) {
          const newDeposits = data?.data?.data || data?.data || [];
          setDeposits(newDeposits);
          setTotal(data?.data?.total || data?.data?.length || 0);
          setDeals([]);
          setWithdraws([])
        }
        else if (activeTab === DEALS_TABS.APPEALS) {
          const newAppeals = data?.data?.appeals || [];
          setAppeals(newAppeals);
          setTotal(data?.data?.total || 0);
          setDeals([]);
          setWithdraws([]);
          setDeposits([]);
        }
        else {
          const newDeals = data?.data?.deals || [];
          setTotal(data?.data?.total || 0);
          setDeals(newDeals);
          setWithdraws([]);
          setDeposits([])
          setAppeals([]);
        }
        setLoadingMore(false);
      },
      onError: (error) => {
        console.error('Error fetching data:', error);
        setLoadingMore(false);
      },
      keepPreviousData: true,
      refetchInterval: 1000 * 30
    }
  );

  useEffect(() => {
    const newQueryString = buildQueryString(
      activeTab,
      filters,
      sortValue,
      searchValue,
      page,
      limit
    );
    setQueryString(newQueryString);
  }, [activeTab, filters, sortValue, searchValue, page, limit]);

  const handleTabChange = (tab: DEALS_TABS) => {
    setActiveTab(tab);
    setPage(0);
    setDeals([]);
    setWithdraws([]);
    setAppeals([]);
    setTotal(0);
    if (tab === DEALS_TABS.APPEALS) {
      setFilters({ status: 'all' });
      setSortValue('New');
    }
  };

  const loadMoreDeals = async () => {
    if (activeTab === DEALS_TABS.APPEALS) return;
    if (loadingMore || total === deals.length || deals.length > total) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    if (!bottomRef.current || isFetching || loadingMore) return

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreDeals();
        }
      },
      { threshold: 1 }
    );

    observer.current.observe(bottomRef.current);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [isFetching, loadingMore, total, deals]);

  useEffect(() => {
    connectWallet()
  }, [connectWallet])


  const renderContent = (): React.ReactNode => {
    if (activeTab === DEALS_TABS.OTC) {
      return <UsersTable
        deals={deals}
        isFetching={isFetching}
        total={total}
        bottomRef={bottomRef}
      />
    }

    if (activeTab === DEALS_TABS.P2P) {
      return <UsersTable
        deals={deals}
        isFetching={isFetching}
        total={total}
        bottomRef={bottomRef}
      />
    }

    if (activeTab === 'WITHDRAW') {
      return <WithdrawTable
        refetch={refetch}
        withdrawItems={withdraws}
      />
    }

    if (activeTab === 'DEPOSITS') {
      return <DepositsTable
        depositItems={deposits}
      />
    }

    if (activeTab === DEALS_TABS.APPEALS) {
      return <AppealsTable
        appeals={appeals}
        isFetching={isFetching}
        searchValue={searchValue}
        sortValue={sortValue}
        onRefetch={() => {
          refetch();
        }}
      />
    }
  }

  const renderHeader = (): React.ReactNode => {
    if (activeTab === DEALS_TABS.OTC) {
      return <Header />
    }

    if (activeTab === DEALS_TABS.P2P) {
      return <Header />
    }

    if (activeTab === DEALS_TABS.WITHDRAW) {
      return <></>
    }

    if (activeTab === DEALS_TABS.DEPOSITS) {
      return <></>
    }

    if (activeTab === DEALS_TABS.APPEALS) {
      return (
        <div style={{ padding: '20px 24px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, color: '#1E2447' }}>Appeals</h1>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by appeal id, wallet, reason..."
              style={{
                minWidth: 320,
                height: 40,
                border: '1px solid #DEE3EE',
                borderRadius: 8,
                padding: '0 12px',
                outline: 'none',
              }}
            />
            <select
              value={sortValue || 'New'}
              onChange={(e) => setSortValue(e.target.value)}
              style={{
                height: 40,
                border: '1px solid #DEE3EE',
                borderRadius: 8,
                padding: '0 12px',
                background: '#fff',
                color: '#1E2447',
              }}
            >
              <option value="New">Date (newest)</option>
              <option value="Old">Date (oldest)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
            </select>
            <select
              value={filters?.status || 'all'}
              onChange={(e) => setFilters({ ...(filters || {}), status: e.target.value })}
              style={{
                height: 40,
                border: '1px solid #DEE3EE',
                borderRadius: 8,
                padding: '0 12px',
                background: '#fff',
                color: '#1E2447',
              }}
            >
              <option value="open">Open</option>
              <option value="in_review">In review</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      )
    }
  }

  return (
    <OtcFilterContext.Provider
      value={{
        activeTab,
        filters,
        onFiltersChange: (value: any) => {
          setFilters(value)
        },
        searchValue,
        onSearchChange: (value: any) => {
          setSearchValue(value)
        },
        sortValue,
        onSortChange: (value: any) => {
          setSortValue(value)
        },
        onReset: () => {
          setFilters(null)
        }
      }}
    >
      <Layout>
        {renderHeader()}
        <TabsWrapper>
          <Tabs
            activeTab={activeTab as string}
            onChange={(value: DEALS_TABS) => {
              handleTabChange(value)
            }}
            tabs={tabs}
          />
        </TabsWrapper>
        {renderContent()}
      </Layout>
    </OtcFilterContext.Provider>
  );
};

export default UsersListOTCPage;
