import React, { FC, useRef, useState } from "react";
import { Body, EmptySectionWrapper, Header, Wrapper } from "./styles";
import PortfolioDashboard from "../Dashboard";
import EmptySection from "../../../../global/EmptySection";
import CreateOwnAsset from "../../../projects/modals/CreateOwnAsset";

interface IProps {
  portfolioId: string
  refetch: any
  variant?: "default" | "core"
}

const PortfolioEmpty: FC<IProps> = ({
  portfolioId,
  refetch,
  variant = "default",
}) => {
  const [isAddAsset, setIsAddAsset] = useState<boolean>(false)
  const isCore = variant === "core";

  return (
    <>
      <Wrapper $core={isCore}>
        <Body $core={isCore}>
          <EmptySectionWrapper $core={isCore}>
            <EmptySection
              className="big-empty-section"
              title="Your portfolio is empty"
              description="Add an asset to start tracking balance, allocation and performance."
              isFullAuth
              btnText="Add Asset"
              onClick={() => setIsAddAsset(true)}
            />
          </EmptySectionWrapper>

          {!isCore ? <PortfolioDashboard isEmpty /> : null}
        </Body>
      </Wrapper>
      <CreateOwnAsset
        portfolioId={portfolioId}
        isVisible={isAddAsset}
        onClose={async () => {
          await refetch()
          setIsAddAsset(false)
        }}
      />
    </>
  );
};

export default PortfolioEmpty;
