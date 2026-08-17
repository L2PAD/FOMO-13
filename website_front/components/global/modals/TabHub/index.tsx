import React, { FC, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import MainModal from "../../common/MainModal";
import Tabs from "../../Tabs";
import { ButtonWrapper, Header, Wrapper } from "./styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import { SearchIconStyle } from "../../Navigation/styles";
import MarketTabsList from "../../MarketTabsList";
import Button from "../../common/Button";
import ExploreTabs from "../../ExploreTabs";
import { Action } from "../../LeftNav/styles";
import { Actions } from "../../UniversalFilter/styles";
import { useQuery, useQueryClient } from "react-query";
import fetchTabs from "../../../../http/tabhub/fetchTabs";
import { AuthContext, LoadingContext } from "../../Layout";
import { useRouter } from "next/router";
import { TabHubModalContext } from "../../../layouts/projects/CryptoMarket/tabHub";
import DeleteModal from "../DeleteModal";
import deleteTab from "../../../../http/tabhub/deleteTab";
import CreateMarketTab from "../CreateMarketTab";
import CustomizeTabModal from "../../../layouts/projects/modals/CustomizeTabModal";
import { ICustomTabs } from "../../../../staticContent/tabs";
import { ICryptoTab } from "../../../layouts/projects/CryptoMarket/createTabContext";
import updateTab from "../../../../http/tabhub/updateTab";

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  openNewTabModal: () => void;
}

const titleDescription = `Tab Hub is your personalized space for managing and accessing customized data tables.
<br/>
<br/>
Easily pin, organize, and explore community-curated datasets, allowing you to track key insights across various categories.`;

const createQueryString = (
  selectedTab: string,
  searchValue: string,
  activeSubtype: string
): string => {
  let path = `all/${selectedTab.toLowerCase()}?page=1&search=${encodeURIComponent(
    searchValue
  )}`;

  if (activeSubtype) {
    path += `&subtype=${encodeURIComponent(activeSubtype)}`;
  }

  return path;
};

const mergeCreatedTabIntoList = (
  previousData: any,
  createdTab: ICryptoTab
) => {
  const previousItems = previousData?.items || previousData?.tabs || [];
  const filteredItems = previousItems.filter(
    (item: ICryptoTab) => item?._id !== createdTab?._id
  );
  const nextItems = [createdTab, ...filteredItems];

  return {
    ...(previousData || {}),
    isSuccess: true,
    items: nextItems,
    tabs: nextItems,
    total: typeof previousData?.total === "number"
      ? previousData.total + (filteredItems.length === previousItems.length ? 1 : 0)
      : nextItems.length,
  };
};

const TabHubModal: FC<IProps> = ({ isVisible, onClose, openNewTabModal }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const {
    isDeleteModal,
    tab,
    isCreateTab,
    isUpdateTab,
    setIsUpdateTab,
    setIsDeleteModal,
    setIsMainModal,
    setTab,
  } = useContext(TabHubModalContext);
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] =
    useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("Saved");
  const [activeSubtype, setActiveSubtype] = useState<string>("New");
  const { isLoading, isError, data } = useQuery(
    ["tabhub", selectedTab, debouncedSearchValue, activeSubtype],
    () => {
      return fetchTabs(
        createQueryString(selectedTab, debouncedSearchValue, activeSubtype)
      );
    },
    {
      enabled: isVisible && !!userData?.isFullAuth,
      keepPreviousData: true,
    }
  );

  const resetState = (): void => {
    setSearchValue("");
    setDebouncedSearchValue("");
    setSelectedTab("Saved");
    setActiveSubtype("New");
  };

  const handleClose = (): void => {
    resetState();
    onClose();
  };

  const invalidateTabQueries = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries("tabhub"),
      queryClient.invalidateQueries("created-tabs"),
    ]);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    if (!isVisible) {
      resetState();
    }
  }, [isVisible]);

  const confirmDeleteTab = async (): Promise<void> => {
    if (!tab) return;
    loadingStateHandler(true);

    const { success } = await deleteTab(tab._id);

    if (success) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Tab removed</p>
        </div>
      );
      await invalidateTabQueries();
    }

    setIsDeleteModal(false);
    loadingStateHandler(false);
  };

  const handleSelectedTab = (): React.ReactNode => {
    if (selectedTab === "Saved") {
      return (
        <MarketTabsList
          isLoading={isLoading}
          isError={isError || data?.isSuccess === false}
          tabs={data?.items || []}
          refetch={invalidateTabQueries}
        />
      );
    }

    return (
      <ExploreTabs
        isLoading={isLoading}
        isError={isError || data?.isSuccess === false}
        tabs={data?.items || []}
        activeSubtype={activeSubtype}
        setActiveSubtype={setActiveSubtype}
        refetch={invalidateTabQueries}
      />
    );
  };

  const onCreate = async (createdTab?: ICryptoTab | null): Promise<void> => {
    setSelectedTab("Saved");
    setSearchValue("");
    setDebouncedSearchValue("");
    setActiveSubtype("New");
    setIsMainModal(true);

    if (createdTab?._id) {
      const normalizedCreatedTab: ICryptoTab = {
        ...createdTab,
        creator:
          typeof createdTab.creator === "object" && createdTab.creator
            ? createdTab.creator
            : {
                _id: userData?._id,
                username: userData?.username,
                photo: userData?.photo,
                twitterData: userData?.twitterData,
                discordData: userData?.discordData,
              },
      };

      queryClient.setQueryData(["created-tabs", undefined], (previousData: any) =>
        mergeCreatedTabIntoList(previousData, normalizedCreatedTab)
      );
    }

    await Promise.all([
      queryClient.invalidateQueries("created-tabs"),
      queryClient.invalidateQueries("tabhub"),
      queryClient.fetchQuery(["tabhub", "Saved", "", "New"], () =>
        fetchTabs(createQueryString("Saved", "", "New"))
      ),
    ]);
  };

  const onConfirmUpdate = async (tabs: Array<ICustomTabs>): Promise<void> => {
    if (!tab?._id) return;

    loadingStateHandler(true);

    const { isSuccess } = await updateTab(tab._id, { tabs });

    if (isSuccess) {
      setIsUpdateTab(false);
      setIsMainModal(true);
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Tab updated</p>
        </div>
      );
      await invalidateTabQueries();
    }

    loadingStateHandler(false);
  };

  return (
    <>
      {isCreateTab ? <CreateMarketTab onCreate={onCreate} /> : <></>}
      <MainModal
        variant="820"
        title="Tab Hub"
        className="share-modal tabhub-modal"
        isVisible={isVisible}
        onClose={handleClose}
        isTitleInfo
        titleDescription={titleDescription}
      >
        <Wrapper>
          <Header>
            <Tabs
              className="main"
              onClick={(value: string) => setSelectedTab(value)}
              items={["Saved", "Explore Tabs"]}
              activeItem={selectedTab}
            />
            <SearchInput
              className="tab-search"
              leftIcon={<SearchIconStyle />}
              placeholder="Search for Tab"
              value={searchValue}
              onChange={(value: string) => setSearchValue(value)}
            />
          </Header>
          {userData?.isFullAuth ? (
            handleSelectedTab()
          ) : (
            <div className="auth-info">
              <p>Login or create an account to use Tab Hub</p>
              <Button onClick={() => router.push("?auth-modal=true")}>
                Login
              </Button>
            </div>
          )}
          {userData?.isFullAuth ? (
            <Actions className="tabhub-actions">
              <Action actionType="red" onClick={handleClose}>
                Cancel
              </Action>
              <Button variant="primary" onClick={openNewTabModal}>
                New Tab
              </Button>
            </Actions>
          ) : null}
        </Wrapper>
      </MainModal>
      <DeleteModal
        isVisible={isDeleteModal}
        onClose={() => {
          setIsDeleteModal(false);
          setIsMainModal(true);
        }}
        onConfirm={confirmDeleteTab}
        text={`Heads up! <span>“${tab?.name || "-"}”</span> tab will disappear forever. Proceed?`}
      />
      <CustomizeTabModal
        tabName={tab?.name || ""}
        tabs={tab?.tabs || []}
        isVisible={isUpdateTab}
        onChange={onConfirmUpdate}
        onClose={() => {
          setIsUpdateTab(false);
          setIsMainModal(true);
        }}
      />
    </>
  );
};

export default TabHubModal;
