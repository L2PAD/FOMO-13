import React, { useState } from "react";
import styled from "styled-components";
import UserAvatar from "../../../global/common/UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import { SearchIconStyle, SearchInput } from "../Networks/styles";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 820px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

const ModalHeader = styled.div`
  padding: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;

  span {
    color: #738094;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #738094;
  transition: color 0.2s;

  &:hover {
    color: #070b35;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SearchWrapper = styled.div`
  padding: 0px 40px 20px 40px;
`;

const ModalBody = styled.div`
  padding: 0px 40px 40px 40px;
  flex: 1;
  display: flex;
  min-height: 0;
`;

const ModalWrapper = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: #f5fbfd;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  width: 100%;
  min-height: 0;
  flex: 1;
`;

const FollowerItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
`;

const FollowerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const FollowerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FollowerName = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const FollowerUsername = styled.div`
  font-size: 13px;
  color: #04a584;
`;

const FollowerStats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const FollowerCount = styled.div`
  font-size: 13px;
  color: #738094;
`;

const FollowerDate = styled.div`
  font-size: 12px;
  color: #738094;
`;

interface Follower {
  _id: string;
  name: string;
  username: string;
  logo: string;
  followersCount: string;
  date: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalCount: string;
  followers: Follower[];
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  title,
  totalCount,
  followers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredFollowers = followers.filter(
    (follower) =>
      follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      follower.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {title} <span>{totalCount}</span>
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </CloseButton>
        </ModalHeader>

        <SearchWrapper>
          <SearchInput
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e)}
            leftIcon={<SearchIconStyle />}
          />
        </SearchWrapper>

        <ModalBody>
          <ModalWrapper>
            {filteredFollowers.map((follower) => (
              <FollowerItem key={follower._id}>
                <FollowerInfo>
                  <UserAvatar
                    size="small"
                    variant="default"
                    avatar={imageLoader(follower.logo)}
                    name={follower.name}
                  />
                  <FollowerDetails>
                    <FollowerName>{follower.name}</FollowerName>
                    <FollowerUsername>@{follower.username}</FollowerUsername>
                  </FollowerDetails>
                </FollowerInfo>
                <FollowerStats>
                  <FollowerCount>
                    {follower.followersCount} Followers
                  </FollowerCount>
                  <FollowerDate>{follower.date}</FollowerDate>
                </FollowerStats>
              </FollowerItem>
            ))}
          </ModalWrapper>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default FollowersModal;
