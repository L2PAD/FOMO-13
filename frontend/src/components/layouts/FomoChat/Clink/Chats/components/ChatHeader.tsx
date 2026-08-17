import React, { FC } from "react";
import { SearchIcon } from "../../../../../../assets";
import { getFomoAdminIconUrl } from "../../../../../services/fomoAdminIcon";
import { AddButton, Header, Logo, LogoText, SearchInputWrapper } from "../styles";

interface ChatHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({
  searchValue,
  onSearchChange,
  onAddClick,
}) => {
  return (
    <>
      <Logo>
        <img src={getFomoAdminIconUrl()} alt="FOMO Logo" />
        <LogoText>
          <span>FOMO</span>
          <div>Chat</div>
        </LogoText>
      </Logo>
      <Header>
        <SearchInputWrapper>
          <SearchIcon fill="#ABAFB199" />
          <input
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
            }
            placeholder="Search messages, people"
          />
        </SearchInputWrapper>
        <AddButton onClick={onAddClick} title="New chat">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 4.16667V15.8333M4.16667 10H15.8333"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </AddButton>
      </Header>
    </>
  );
};

export default ChatHeader;
