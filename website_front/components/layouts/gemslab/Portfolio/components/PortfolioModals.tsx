import React, { FC } from "react";
import {
  IPortfolio,
  IPortfolioSummary,
} from "../../../../../types/global_types";
import DeleteModal from "../../../../global/modals/DeleteModal";
import PortfolioBattleModal from "../../../../global/modals/PortfolioBattle";
import CreatePortfolio from "../../../projects/modals/CreatePortfolio";
import EditPortfolio from "../../../projects/modals/EditPortfolio";
import ShareModal from "../ShareModal";
import { DELETE_PORTFOLIO_MODAL_TEXT } from "../constants";
import { PortfolioSelection } from "../types";

interface PortfolioModalsProps {
  isNewPortfolioModal: boolean;
  onCloseNewPortfolio: () => void;
  refetchPortfolioList: any;
  onPortfolioCreated: (portfolio: { _id: string }) => void;
  selectedPortfolio?: IPortfolio | null;
  isEditPortfolioModal: boolean;
  onCloseEditPortfolio: () => Promise<void>;
  refetchActivePortfolio: () => Promise<void>;
  isDeletePortfolioModal: boolean;
  onCloseDeletePortfolio: () => void;
  onConfirmDelete: () => Promise<void>;
  selectedPortfolioSummary?: IPortfolioSummary;
  isPortfolioBattleModal: boolean;
  onClosePortfolioBattle: () => void;
  onConfirmBattle: (portfolio: PortfolioSelection) => Promise<void>;
  hasOtherBattlePortfolio: boolean;
  isSharePortfolioModal: boolean;
  onCloseSharePortfolio: () => void;
}

const PortfolioModals: FC<PortfolioModalsProps> = ({
  isNewPortfolioModal,
  onCloseNewPortfolio,
  refetchPortfolioList,
  onPortfolioCreated,
  selectedPortfolio,
  isEditPortfolioModal,
  onCloseEditPortfolio,
  refetchActivePortfolio,
  isDeletePortfolioModal,
  onCloseDeletePortfolio,
  onConfirmDelete,
  selectedPortfolioSummary,
  isPortfolioBattleModal,
  onClosePortfolioBattle,
  onConfirmBattle,
  hasOtherBattlePortfolio,
  isSharePortfolioModal,
  onCloseSharePortfolio,
}) => {
  return (
    <>
      <CreatePortfolio
        isVisible={isNewPortfolioModal}
        onClose={onCloseNewPortfolio}
        refetch={refetchPortfolioList}
        onCreated={onPortfolioCreated}
      />
      <EditPortfolio
        initalData={selectedPortfolio || undefined}
        isVisible={isEditPortfolioModal}
        onClose={onCloseEditPortfolio}
        refetch={refetchActivePortfolio}
      />
      <DeleteModal
        text={DELETE_PORTFOLIO_MODAL_TEXT}
        isVisible={isDeletePortfolioModal}
        onClose={onCloseDeletePortfolio}
        onConfirm={onConfirmDelete}
        variant="small"
      />
      <PortfolioBattleModal
        portfolio={selectedPortfolio || (selectedPortfolioSummary as any)}
        isVisible={isPortfolioBattleModal}
        onClose={onClosePortfolioBattle}
        onConfirm={onConfirmBattle}
        hasOtherBattlePortfolio={hasOtherBattlePortfolio}
      />
      <ShareModal
        portfolio={selectedPortfolio || undefined}
        isVisible={isSharePortfolioModal}
        onClose={onCloseSharePortfolio}
        refetch={refetchActivePortfolio}
      />
    </>
  );
};

export default PortfolioModals;
