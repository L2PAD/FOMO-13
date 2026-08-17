import React, { FC } from "react";
import { LeftColumn, RightColumn } from "../../../Crypto/Project/crypto-styles";
import { PortfolioBody } from "../../../../gemslab/Portfolio/styles";
import UserTabs from "../../../../../global/UserTabs";
import UserPostedContent from "../../../../../global/UserPostedContent";
import UserCommentHistory from "../../../../../global/UserCommentHistory";
import UserFollow from "../../../../gemslab/Portfolio/UserFollow";
import DynamicMovers from "../../../../gemslab/Portfolio/DynamicMovers";
import FomiesLeaderboard from "../Leaderboard/FomiesLeaderboard";
import UserShowdown from "../UserShowdown";
import BattleBoard from "../BattleBoard/BattleBoard";
import PortfolioROI from "../PortfolioROI";
import { Overview, PortfolioSnapshot } from "../styles";
import FollowMe from "./FollowMe";
import { FomiesPersonData, FomiesTab } from "./types";
import { IPortfolio } from "../../../../../../types/global_types";
import PortfolioChart from "../../../../gemslab/Portfolio/PortfolioChart";
import Breakdown from "../../../../gemslab/Portfolio/Breakdown";
import WalletBalancePie from "../../../../gemslab/Portfolio/WalletBalancePie";
import TransactionsList from "../../../../gemslab/Portfolio/Transactions";
import FomiesPortfolioEmptyState from "./FomiesPortfolioEmptyState";
import { useTranslation } from "i18n";

interface Props {
  activeTab: FomiesTab;
  isPublicPortfolioLoading?: boolean;
  personData: FomiesPersonData;
  publicPortfolio?: IPortfolio | null;
}

const FomiesTabsContent: FC<Props> = ({
  activeTab,
  isPublicPortfolioLoading = false,
  personData,
  publicPortfolio,
}) => {
  const { translateText } = useTranslation();

  switch (activeTab) {
    case "Follow Me":
      return (
        <PortfolioSnapshot>
          <FollowMe userId={(personData as any)?._id || (personData as any)?.id} />
        </PortfolioSnapshot>
      );
    case "Overview":
      return (
        <PortfolioSnapshot>
          <PortfolioBody>
            {publicPortfolio ? (
              <PortfolioChart
                portfolio={publicPortfolio}
                isPublic
              />
            ) : (
              <FomiesPortfolioEmptyState isLoading={isPublicPortfolioLoading} />
            )}
          </PortfolioBody>
          <Overview>
            <LeftColumn>
              {publicPortfolio ? (
                <>
                  <Breakdown
                    portfolio={publicPortfolio}
                    portfolioRefetch={async () => { }}
                    isPortfolioOwner={false}
                    isPublic
                  />
                  <WalletBalancePie portfolio={publicPortfolio} isPublic />
                  <TransactionsList
                    portfolioId={publicPortfolio._id}
                    isPublic
                  />
                </>
              ) : <></>}
            </LeftColumn>
            {
              publicPortfolio ?
                <RightColumn>
                  <h2>{translateText("Created Tabs")}</h2>
                  <UserTabs userId={personData?._id} />
                  <h2 style={{ marginTop: "20px" }}>{translateText("Posted Content")}</h2>
                  <UserPostedContent userId={personData?._id} />
                  <h2 style={{ marginTop: "20px" }}>{translateText("Comment History")}</h2>
                  <UserCommentHistory userId={personData._id} />
                </RightColumn>
                :
                <></>
            }
          </Overview>
          <UserFollow personData={personData} />
        </PortfolioSnapshot>
      );
    case "Comparison":
      return (
        <PortfolioSnapshot>
          <FomiesLeaderboard />
          <UserShowdown personData={personData} publicPortfolio={publicPortfolio} />
          <BattleBoard />
          <PortfolioROI personData={personData} />
          <DynamicMovers />
        </PortfolioSnapshot>
      );
    default:
      return <></>;
  }
};

export default FomiesTabsContent;
