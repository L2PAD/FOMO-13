/* eslint-disable */
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import copy from "clipboard-copy";
import addComment from "../../../../../http/comments/addComment";
import CommentBlock from "../../../../global/CommentBlock";
import {
  AuthContext,
  LocationContext,
  WatchlistContext,
} from "../../../../global/Layout";
import {
  IComment,
  IPerson,
  IPortfolio,
  IProject,
} from "../../../../../types/global_types";
import addProjectToWatchlist from "../../../../../http/watchlist/addProjectToWatchlist";
import deleteFromWatchlist from "../../../../../http/watchlist/deleteFromWatchlist";
import { getPublicPortfolioByUserId } from "../../../../../http/portfolio";
import updateProject from "../../../../../http/projects/updateProject";
import { PageWrapper } from "../../CryptoMarket/styles";
import { TabsContentWrapper, TabsWrapper } from "../../Crypto/Project/crypto-styles";
import Tabs from "../../../../global/Tabs";
import addReaction from "../../../../../http/likes/addReaction";
import {
  FomiesDataContext,
  IFomiesWithRefetch,
} from "../../../../../pages/crypto/fomies/[id]";
import { IDescriptionModals } from "../../../gemslab/Profile";
import FomiesActionsMenu from "./FomiesActionsMenu";
import followUpdate from "../../../../../http/user/followUpdate";
import FomiesHeader from "./components/FomiesHeader";
import FomiesProfileStats from "./components/FomiesProfileStats";
import FomiesTabsContent from "./components/FomiesTabsContent";
import {
  FOMIES_TABS,
  FomiesAuthUser,
  FomiesPersonData,
  FomiesTab,
  FomiesWatchlist,
} from "./components/types";
import { useTranslation } from "i18n";

export interface IPersonProps {
  person: IPerson;
  personDataToUpdate: IPerson | null;
  isEditState: boolean;
  projects?: Array<IProject>;
  onChange: (name: string, value: any) => void;
}

const FomiesPageWrapper = styled(PageWrapper)`
  @media (min-width: 769px) and (max-width: 1204px) {
    margin-top: 20px;
  }

  @media (max-width: 768px) {
    padding-top: 12px;
  }
`;

const Fomies = () => {
  const { translateText } = useTranslation();
  const { userData } = useContext(AuthContext) as { userData: FomiesAuthUser };
  const personData = useContext(FomiesDataContext) as FomiesPersonData;
  const { path } = useContext(LocationContext);
  const { watchlist } = useContext(WatchlistContext) as {
    watchlist?: FomiesWatchlist;
  };
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<FomiesTab>(FOMIES_TABS[0]);
  const [personDataToUpdate, setPersonDataToUpdate] = useState<IPerson | null>(
    null
  );
  const [isEditState, setIsEditState] = useState<boolean>(false);
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [descriptionModals, setDescriptionModals] =
    useState<IDescriptionModals>({
      isScope: false,
      isLvlOne: false,
      isLvlTwo: false,
    });
  const [isMenu, setIsMenu] = useState<boolean>(false);

  const [newComments, setNewComments] = useState<Array<IComment>>([]);
  const [isWatchListProject, setIsWatchListProject] = useState<boolean>(
    !!watchlist?.persons?.find((item) => item?._id === personData._id)
  );
  const isFollowing: boolean = !!personData?.followers?.includes(userData?._id || "");
  const { data: publicPortfolio, isLoading: isPublicPortfolioLoading } = useQuery<IPortfolio | null>(
    ["public-fomie-portfolio", personData?._id],
    () => getPublicPortfolioByUserId(personData?._id || ""),
    {
      enabled: !!personData?._id,
      refetchOnWindowFocus: false,
    }
  );

  const confirmAddComment = async (text: string): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("You need to be fully logged in to add comments")}</p>
        </div>
      );
      return;
    }

    const newComment: IComment = {
      text,
      author: [userData as any],
      date: new Date(),
    };

    const { isSuccess } = await addComment(
      `persons/comment/${personData._id}`,
      newComment
    );

    if (isSuccess) {
      personData.refetch();
    }
  };

  const updateWatchList = async (): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("You need to be fully logged in to add project to watchlist")}</p>
        </div>
      );
      return;
    }

    if (isWatchListProject) {
      const { success } = await deleteFromWatchlist(
        path,
        String(personData._id)
      );
      if (success) {
        toast.success(
          <div>
            <h3>{translateText("Success!")}</h3>
            <p>{translateText("Person deleted from favorites")}</p>
          </div>
        );
      }
      setIsWatchListProject(false);
      return;
    }

    const { success } = await addProjectToWatchlist(path, String(personData._id));
    setIsWatchListProject(success);
    if (success) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Person added to favorites")}</p>
        </div>
      );
    }
  };

  const confirmAction = async (type: "like" | "dislike"): Promise<void> => {
    await addReaction("user", type, personData._id || "");
    await personData.refetch();
  };

  const confirmFollowAction = async (
    type: "follow" | "unfollow"
  ): Promise<void> => {
    await followUpdate(type, personData._id || "");
    await personData.refetch();
  };

  const copyWallet = (): void => {
    const wallet = personData?.wallet || "";

    if (!wallet) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("This profile has no wallet address")}</p>
        </div>
      );
      return;
    }

    copy(wallet);

    toast.success(
      <div>
        <h3>{translateText("Copied!")}</h3>
        <p>{translateText("You have successfully copied a wallet address")}</p>
      </div>
    );
  };

  const getScopeDescription = (): string => {
    if ((userData?.points || 0) < 400) {
      return `
        <div>
          Current Rank: <span class="bold">Explorer</span>
          <p>You have starting your journey on FOMO. Interact, explore, and grow experience!</p>
          Next level: <span class="bold">Builder (400 XP)</span>
        </div>
      `;
    }
    if ((userData?.points || 0) < 800) {
      return `
        <div>
          Current Rank: <span class="bold">Builder</span>
          <p>You have becoming an active member of the community. Stay engaged to reach the Pro level!</p>
          Next level: <span class="bold">Pro (800 XP)</span>
        </div>
      `;
    }

    if ((userData?.points || 0) > 799) {
      return `
      <div>
        Current Rank: <span class="bold">Pro</span>
        <p>You have reached the highest rank!  A respected and recognized member of the platform.</p>
        Next level: <span class="bold">Max level achieved!</span>
      </div>
    `;
    }

    return `
    <div>
      Current Rank: <span class="bold">Explorer</span>
      <p>You have starting your journey on FOMO. Interact, explore, and grow experience!</p>
      Next level: <span class="bold">Builder (400 XP)</span>
    </div>
  `;
  };

  useEffect(() => {
    if (personData) setPersonDataToUpdate(personData);
  }, [personData]);

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

  return (
    <FomiesPageWrapper>
      <FomiesHeader
        isActionsPopoverOpen={isActionsPopoverOpen}
        isFollowing={isFollowing}
        isMobile={isMobile}
        isSocialsPopoverOpen={isSocialsPopoverOpen}
        isWatchListProject={isWatchListProject}
        onCloseActionsPopover={closeActionsPopover}
        onCloseSocialsPopover={closeSocialsPopover}
        onDislike={() => confirmAction("dislike")}
        onFollowButtonClick={() => confirmFollowAction("follow")}
        onLike={() => confirmAction("like")}
        onToggleActionsPopover={handleActionsClick}
        onToggleSocialsPopover={handleSocialsClick}
        onUpdateWatchlist={updateWatchList}
        personData={personData}
        userData={userData}
      />

      <FomiesProfileStats
        descriptionModals={descriptionModals}
        onCopyWallet={copyWallet}
        onScopeMouseEnter={() => {
          setDescriptionModals((prev) => {
            return { ...prev, isScope: true };
          });
        }}
        onScopeMouseLeave={() => {
          setDescriptionModals((prev) => {
            return { ...prev, isScope: false };
          });
        }}
        personData={personData}
        scopeDescription={getScopeDescription()}
      />

      <TabsWrapper style={{ width: "100%", marginTop: "20px" }}>
        <Tabs
          className="project-page"
          onClick={(value) => setActiveTab(value as FomiesTab)}
          activeItem={activeTab}
          items={FOMIES_TABS as unknown as string[]}
        />
      </TabsWrapper>
      <TabsContentWrapper>
        <FomiesTabsContent
          activeTab={activeTab}
          isPublicPortfolioLoading={isPublicPortfolioLoading}
          personData={personData}
          publicPortfolio={publicPortfolio}
        />
      </TabsContentWrapper>

      <CommentBlock
        refetch={personData.refetch}
        addComment={confirmAddComment}
        items={
          personData.comments
            ? [...newComments, ...personData.comments]
            : newComments
        }
      />
      <FomiesActionsMenu isVisible={isMenu} onClose={() => setIsMenu(false)} />
    </FomiesPageWrapper>
  );
};

export default Fomies;
