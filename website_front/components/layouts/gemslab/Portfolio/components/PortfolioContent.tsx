import React, { FC } from "react";
import { IPortfolio } from "../../../../../types/global_types";
import EmptyList from "../../../../global/EmptyList";
import { Button } from "../../../../global/common/Button";
import Breakdown from "../Breakdown";
import CorePortfolioChart from "../CorePortfolioChart";
import MoversList from "../MoversList";
import PortfolioEmpty from "../PortfolioEmpty";
import TransactionsList from "../Transactions";
import WalletBalancePie from "../WalletBalancePie";
import {
  CoreAnalyticsLayout,
  CoreMoversGrid,
  CoreSection,
  CoreSectionHeader,
  CoreSecondaryGrid,
  CoreStateCard,
} from "../coreStyles";
import { PortfolioBody } from "../styles";
import CorePortfolioMetrics from "./CorePortfolioMetrics";

interface PortfolioContentProps {
  isListLoading: boolean;
  isListError: boolean;
  isDetailLoading: boolean;
  isDetailError: boolean;
  activePortfolioId: string;
  selectedPortfolio?: IPortfolio | null;
  selectedPortfolioHasAssets: boolean;
  refetchPortfolioList: () => Promise<unknown>;
  refetchPortfolioDetail: () => Promise<unknown>;
  refetchActivePortfolio: () => Promise<void>;
  moversData?: {
    gainers?: Array<any>;
    losers?: Array<any>;
  };
  isMoversLoading: boolean;
}

const PortfolioContent: FC<PortfolioContentProps> = ({
  isListLoading,
  isListError,
  isDetailLoading,
  isDetailError,
  activePortfolioId,
  selectedPortfolio,
  selectedPortfolioHasAssets,
  refetchPortfolioList,
  refetchPortfolioDetail,
  refetchActivePortfolio,
  moversData,
  isMoversLoading,
}) => {
  if (isListError) {
    return (
      <CoreStateCard $error>
        <EmptyList />
        <div>We could not load your portfolios.</div>
        <Button variant="outlined" onClick={() => refetchPortfolioList()}>
          Try again
        </Button>
      </CoreStateCard>
    );
  }

  if (isDetailError) {
    return (
      <CoreStateCard $error>
        <EmptyList />
        <div>We could not load this portfolio.</div>
        <Button variant="outlined" onClick={() => refetchPortfolioDetail()}>
          Retry portfolio
        </Button>
      </CoreStateCard>
    );
  }

  if (isListLoading || (isDetailLoading && activePortfolioId)) return null;

  if (!selectedPortfolio) {
    return (
      <CoreStateCard>
        <EmptyList />
        <div>Create a portfolio to start tracking performance.</div>
      </CoreStateCard>
    );
  }

  if (!selectedPortfolioHasAssets) {
    return (
      <PortfolioEmpty
        refetch={refetchActivePortfolio}
        portfolioId={selectedPortfolio._id || ""}
        variant="core"
      />
    );
  }

  return (
    <PortfolioBody>
      <CoreAnalyticsLayout>
        <CorePortfolioChart
          key={selectedPortfolio._id}
          portfolio={selectedPortfolio}
        />
        <CorePortfolioMetrics portfolio={selectedPortfolio} />
      </CoreAnalyticsLayout>

      <CoreSection>
        <Breakdown
          portfolio={selectedPortfolio}
          portfolioRefetch={refetchActivePortfolio}
          variant="core"
        />
      </CoreSection>

      <CoreSection>
        <CoreSecondaryGrid>
          <WalletBalancePie portfolio={selectedPortfolio} variant="core" />
          <TransactionsList
            portfolioId={selectedPortfolio._id}
            variant="core"
          />
        </CoreSecondaryGrid>
      </CoreSection>

      <CoreSection>
        <CoreSectionHeader>
          <div>
            <h2>Top movers</h2>
            <p>Assets with the strongest impact on this portfolio.</p>
          </div>
        </CoreSectionHeader>
        <CoreMoversGrid>
          <MoversList
            title="Top gainers"
            items={moversData?.gainers || []}
            variant="core"
            isLoading={isMoversLoading}
          />
          <MoversList
            title="Top losers"
            items={moversData?.losers || []}
            variant="core"
            isLoading={isMoversLoading}
          />
        </CoreMoversGrid>
      </CoreSection>
    </PortfolioBody>
  );
};

export default PortfolioContent;
