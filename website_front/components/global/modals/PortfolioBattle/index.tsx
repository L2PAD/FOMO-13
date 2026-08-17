import React, { FC, useMemo, useState } from "react";
import {
  ConfirmButton,
  RejectButton,
} from "../../../layouts/projects/OTC/DealItem/styles";
import MainModal from "../../common/MainModal";
import { Body, Buttons, IconWrapper, SmallButtons, Wrapper } from "./styles";
import { IPortfolio } from "../../../../types/global_types";
import { sanitizedHtml } from "../../../../helpers/sanitizeHtml";

interface IProps {
  portfolio: IPortfolio | undefined;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (item: IPortfolio) => void;
  hasOtherBattlePortfolio: boolean;
}

type BattleModalSteps =
  | "add_portfolio"
  | "you_have_battle_portfolio"
  | "portfolio_already_battle"
  | "portfolio_added"
  | "portfolio_replaced"
  | "portfolio_removed";

const PortfolioBattleModal: FC<IProps> = ({
  portfolio,
  isVisible,
  onClose,
  onConfirm,
  hasOtherBattlePortfolio,
}) => {
  const isAlreadyBattle = !!portfolio?.isBattle;

  const initialStep: BattleModalSteps = useMemo(() => {
    if (isAlreadyBattle) return "portfolio_already_battle";
    if (!isAlreadyBattle && hasOtherBattlePortfolio)
      return "you_have_battle_portfolio";
    return "add_portfolio";
  }, [portfolio, hasOtherBattlePortfolio]);

  const [step, setStep] = useState<BattleModalSteps>(initialStep);

  React.useEffect(() => {
    setStep(initialStep);
  }, [initialStep, portfolio]);

  const getContent = (): React.ReactNode => {
    switch (step) {
      case "add_portfolio":
        return (
          <Wrapper>
            <Body
              className="small-delete-modal"
              dangerouslySetInnerHTML={sanitizedHtml(`<h3>Add Portfolio to Battle?</h3><p>
                  Are you sure you want to add this portfolio to the public Battle Board?
                </p>`)}
            />
            <SmallButtons>
              <ConfirmButton onClick={() => portfolio && onConfirm(portfolio)}>Confirm</ConfirmButton>
              <button onClick={onClose}>Cancel</button>
            </SmallButtons>
          </Wrapper>
        );

      case "you_have_battle_portfolio":
        return (
          <Wrapper>
            <IconWrapper>{/* your icon */}</IconWrapper>
            <Body
              className="small-delete-modal"
              dangerouslySetInnerHTML={sanitizedHtml(`<h3>You Already Have a Portfolio in Battle</h3>
                  <p>Only one portfolio can participate...</p>`)}
            />
            <SmallButtons>
              <ConfirmButton onClick={() => portfolio && onConfirm(portfolio)}>
                Replace with this one
              </ConfirmButton>
              <button onClick={onClose}>Cancel</button>
            </SmallButtons>
          </Wrapper>
        );

      case "portfolio_already_battle":
        return (
          <Wrapper>
            <IconWrapper>{/* your icon */}</IconWrapper>
            <Body
              className="small-delete-modal"
              dangerouslySetInnerHTML={sanitizedHtml(`<h3>This Portfolio Is Already in the Battle</h3>
                  <p>You can remove it anytime.</p>`)}
            />
            <SmallButtons>
              <RejectButton onClick={() => portfolio && onConfirm(portfolio)}>
                Remove from Battle
              </RejectButton>
              <button onClick={onClose}>Keep it in Battle</button>
            </SmallButtons>
          </Wrapper>
        );

      case "portfolio_added":
        return (
          <Wrapper>
            <Body
              dangerouslySetInnerHTML={sanitizedHtml(`<h3>Portfolio Added!</h3>`)}
            />
            <SmallButtons>
              <ConfirmButton onClick={onClose}>Great!</ConfirmButton>
            </SmallButtons>
          </Wrapper>
        );

      case "portfolio_replaced":
        return (
          <Wrapper>
            <Body
              dangerouslySetInnerHTML={sanitizedHtml(`<h3>Portfolio Replaced</h3>`)}
            />
            <SmallButtons>
              <ConfirmButton onClick={onClose}>Great!</ConfirmButton>
            </SmallButtons>
          </Wrapper>
        );

      case "portfolio_removed":
        return (
          <Wrapper>
            <Body
              dangerouslySetInnerHTML={sanitizedHtml(`<h3>Removed from Battle</h3>`)}
            />
            <SmallButtons>
              <ConfirmButton onClick={onClose}>Great!</ConfirmButton>
            </SmallButtons>
          </Wrapper>
        );

      default:
        return null;
    }
  };

  return (
    <MainModal
      variant="cart"
      title=""
      isTitle={false}
      className="share-modal"
      isVisible={isVisible}
      onClose={onClose}
    >
      {getContent()}
    </MainModal>
  );
};

export default PortfolioBattleModal;
