import React, { FC, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { X } from "lucide-react";

import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  SearchInput,
  SelectedUsers,
  SelectedUserChip,
  SuggestedSection,
  SuggestedTitle,
  UsersWrapper,
  UserRow,
  UserDataWrapper,
  UserCheckbox,
  SendButton,
} from "./styles";
import UserAvatar from "../../../../../../global/common/UserAvatar";
import { IUser } from "../../../../../../../types/global_types";
import imageLoader from "../../../../../../../helpers/imageLoader";
import Input from "../../../../../../global/common/Input";
import fetchUsers from "../../../../../../../http/user/fetchUsers";
import { useTranslation } from "i18n";

interface Props {
  onClose: () => void;
  onConfirm: (users: IUser[]) => void;
}

const ForwardModal: FC<Props> = ({ onClose, onConfirm }) => {
  const { t } = useTranslation();
  const { data } = useQuery("users", () => fetchUsers(0, "none"));
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");

  const filteredUsers: Array<IUser> = useMemo(() => {
    if (!data?.users) return [];
    if (!searchValue) return data?.users;

    return data?.users.filter((item: IUser) => {
      return (
        item?.username?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
        item?.twitterData?.username
          ?.toLowerCase()
          ?.includes(searchValue.toLowerCase()) ||
        item?.wallet?.toLowerCase().includes(searchValue.toLowerCase())
      );
    });
  }, [searchValue, data]);

  const toggleUser = (user: IUser) => {
    if (selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleSend = () => {
    onConfirm(selectedUsers);
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t("chat.actions.forward")}</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <SearchInput>
          <span>{t("chat.labels.to")}</span>
          <Input
            placeholder={t("common.placeholders.search")}
            type="text"
            value={searchValue}
            onChange={(value: string) => setSearchValue(value)}
          />
        </SearchInput>

        {selectedUsers.length > 0 && (
          <SelectedUsers>
            {selectedUsers.map((user) => (
              <SelectedUserChip key={user._id}>
                {user.username || user?.twitterData?.username}
                <button onClick={() => removeUser(user._id!)}>×</button>
              </SelectedUserChip>
            ))}
          </SelectedUsers>
        )}

        <SuggestedSection>
          <SuggestedTitle>{t("chat.sections.suggested")}</SuggestedTitle>
          <UsersWrapper>
            {filteredUsers.map((item: IUser) => {
              const isSelected = selectedUsers.find((u) => u._id === item._id);
              return (
                <UserRow
                  key={item._id}
                  onClick={() => toggleUser(item)}
                  isSelected={!!isSelected}
                >
                  <UserDataWrapper>
                    <UserAvatar
                      size="otc"
                      variant="default"
                      avatar={
                        item.photo
                          ? imageLoader(item.photo)
                          : item?.twitterData?.photo
                      }
                      name="name"
                    />
                    <div>
                      <p>{item.username || item?.twitterData?.username}</p>
                      <span>@{item?.twitterData?.username}</span>
                    </div>
                  </UserDataWrapper>
                  <UserCheckbox isChecked={!!isSelected}>
                    {isSelected && (
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 12 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 4L4.5 7.5L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </UserCheckbox>
                </UserRow>
              );
            })}
          </UsersWrapper>
        </SuggestedSection>

        <SendButton onClick={handleSend} disabled={selectedUsers.length === 0}>
          {t("chat.actions.send")}
        </SendButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ForwardModal;
