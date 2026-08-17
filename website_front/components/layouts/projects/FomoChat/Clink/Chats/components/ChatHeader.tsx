import React, { FC } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import FOMOLogo from "../../../../../../../assets/images/fomo-logo.png";
import { SearchIcon } from "../../../../../../global/Icons";
import {
  AddButton,
  Header,
  Logo,
  LogoText,
  SearchInputWrapper,
} from "../styles";
import { useTranslation } from "i18n";

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
  const { t } = useTranslation();

  return (
    <>
      <Logo>
        <Image src={FOMOLogo} alt="FOMO Logo" />
        <LogoText>
          <span>FOMO</span>
          <div>{t("chat.title")}</div>
        </LogoText>
      </Logo>
      <Header>
        <SearchInputWrapper>
          <SearchIcon fill="#ABAFB199" />
          <input
            value={searchValue}
            onChange={(e: any) => onSearchChange(e.target.value)}
            placeholder={t("chat.placeholders.searchMessagesPeople")}
          />
        </SearchInputWrapper>
        <AddButton onClick={onAddClick}>
          <Plus width={20} height={20} />
        </AddButton>
      </Header>
    </>
  );
};

export default ChatHeader;
