import React, { FC, useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { AuthContext } from "../../Layout";
import DescriptionComponent from "../DescriptionComponent";
import Placeholder from "../Placeholder";

const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  position: relative;
  cursor: pointer;
`;

const IconWrapper = styled.div<{ $isActive: boolean }>`
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 8px;
  background: ${({ $isActive }) => ($isActive ? "var(--main-green)" : "#b5bcc7")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
  }

  svg path {
    stroke: white;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
`;

const Title = styled.div`
  font-size: 16px;
  line-height: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--main-black);
  white-space: nowrap;
`;

const Description = styled.div`
  font-size: 14px;
  line-height: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--main-gray);
  white-space: nowrap;
`;

const DescriptionWrapper = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: -25px;
  z-index: 5;
  width: 320px;
  max-width: min(320px, calc(100vw - 24px));

  & > div {
    width: 100%;
    box-sizing: border-box;
  }

  & .description-modal-text {
    display: block;
    width: 100%;
    white-space: normal;
    line-height: 16px;
  }
`;

interface IProps {
  className?: string;
  title?: string;
  description?: string;
}

const NFTAccessLabel: FC<IProps> = ({
  className,
  title = "No FOMO NFT",
  description = "Limited access",
}) => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [hasResolvedInitialLoad, setHasResolvedInitialLoad] = useState(false);
  const isSpaceportLoading = Boolean(authContext?.spaceportAccess?.isLoading);
  const hasActiveFomoNft = Boolean(
    authContext?.hasBoughtSpaceportNft || authContext?.hasSpaceportNft
  );
  const resolvedTitle = hasActiveFomoNft ? "FOMO NFT" : title;
  const resolvedDescription = hasActiveFomoNft
    ? "You have access to FOMO NFT features"
    : description;

  useEffect(() => {
    if (!isSpaceportLoading) {
      setHasResolvedInitialLoad(true);
    }
  }, [isSpaceportLoading]);

  if (!hasResolvedInitialLoad && isSpaceportLoading) {
    return (
      <Placeholder
        width="184px"
        height="42px"
        borderRadius="12px"
        marginBottom="0"
      />
    );
  }

  return (
    <Wrapper
      className={className}
      onClick={() => router.push("/core/spaceport")}
      onMouseEnter={() => setIsDescriptionVisible(true)}
      onMouseLeave={() => setIsDescriptionVisible(false)}
    >
      <IconWrapper $isActive={hasActiveFomoNft} aria-hidden="true">
        <svg
          width="38"
          height="38"
          viewBox="0 0 38 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.0396 26.3689C13.5963 26.3689 13.1001 26.0205 12.9524 25.5983L8.58237 13.375C7.95959 11.6227 8.68792 11.0844 10.1868 12.1611L14.3035 15.1061C14.9896 15.5811 15.7707 15.3383 16.0663 14.5677L17.924 9.61719C18.5151 8.03385 19.4968 8.03385 20.0879 9.61719L21.9457 14.5677C22.2413 15.3383 23.0224 15.5811 23.6979 15.1061L27.5613 12.3511C29.2079 11.1689 29.9996 11.7705 29.324 13.6811L25.0596 25.6194C24.9013 26.0205 24.4051 26.3689 23.9618 26.3689H14.0396Z"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.1943 29.5586H24.8054"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.3604 21.1094H21.6381"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconWrapper>

      <Content>
        <Title>{resolvedTitle}</Title>
        <Description>{resolvedDescription}</Description>
      </Content>
      <DescriptionWrapper>
        <DescriptionComponent
          className="gray-description"
          isVisible={isDescriptionVisible}
          date={new Date()}
          isDate={false}
          text={
            hasActiveFomoNft
              ? "Your wallet is connected to a <span class='bold'>FOMO NFT</span>. Premium access is enabled."
              : "Connect a wallet with a purchased <span class='bold'>FOMO NFT</span> to unlock premium access."
          }
        />
      </DescriptionWrapper>
    </Wrapper>
  );
};

export default NFTAccessLabel;
