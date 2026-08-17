import React, { useContext } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import styled from "styled-components";
import AlertIcon from "../Icons/AlertIcon";
import { AuthContext } from "../Layout";
import { fetchFeedAccess } from "../../../http/comments/feedAccess";

const Wrapper = styled.div`
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: #FEFCF3;
  border: 1px solid #FFEBD2;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #C24C00;

  span {
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
  }

  svg {
    flex-shrink: 0;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  flex: 1 1 0;
  min-width: 0;
  height: 30px;
  border-radius: 8px;
  background: #FFC704;
  color: #ffffff;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.7;
    transform: translateY(1px);
  }

  &.secondary {
    background: transparent;
    color: #C24C00;
    border: 1px solid #FFC704;
  }
`;

/**
 * Universal access banner.
 * FOMO now grants premium access via an active membership OR an eligible FOMO NFT.
 * The backend AccessResolver (exposed through /comments/feed/access) already returns
 * a single combined decision, so this banner:
 *   • sells access universally — routing to Memberships (subscribe) OR Spaceport (NFT);
 *   • disappears the moment the user has ANY qualifying access (membership or NFT).
 * Kept compact (same footprint as the previous single-button banner).
 */
const BuyFomoNftBanner = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);

  const hasFomoNft = Boolean(
    authContext?.hasBoughtSpaceportNft || authContext?.hasSpaceportNft
  );
  const isSpaceportLoading = Boolean(authContext?.spaceportAccess?.isLoading);

  // Combined backend access check (membership active OR eligible NFT/source).
  const { data: access, isLoading: accessLoading } = useQuery(
    ["universal-access"],
    fetchFeedAccess,
    { staleTime: 30_000, retry: false }
  );

  const hasAccess = hasFomoNft || Boolean(access?.allowed) || Boolean(access?.membership?.active);

  // Hide while any access signal is still resolving, or once access is granted.
  if (isSpaceportLoading || accessLoading || hasAccess) {
    return null;
  }

  return (
    <Wrapper data-testid="universal-access-banner">
      <MessageRow>
        <AlertIcon fill="#C24C00" />
        <span>Unlock full FOMO access.</span>
      </MessageRow>

      <ActionsRow>
        <ActionButton
          type="button"
          data-testid="universal-access-membership"
          onClick={() => router.push("/utility/memberships")}
        >
          Membership
        </ActionButton>
        <ActionButton
          type="button"
          className="secondary"
          data-testid="universal-access-nft"
          onClick={() => router.push("/core/spaceport")}
        >
          Buy NFT
        </ActionButton>
      </ActionsRow>
    </Wrapper>
  );
};

export default BuyFomoNftBanner;
