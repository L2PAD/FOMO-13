import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import { ArrowDownIcon } from "../../../../global/Icons";
import { ActionsWrapper } from "../CustomizeTabModal/styles";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import Checkbox from "../../../../global/common/Checkbox";
import UserAvatar from "../../../../global/common/UserAvatar";
import {
  AssetCheckboxes,
  AssetRow,
  AssetsHeader,
  AssetsWrapper,
  CreateAssetWrapper,
  DropdownWrapper,
  ProjectsWrapper,
  SearchWrapper,
  SelectWrapper,
} from "./styles";
import MainModal from "../../../../global/common/MainModal";
import { SearchInput } from "../../P2PExchange/styles";
import {
  ResetButton,
  Actions,
} from "../../../../global/UniversalFilter/styles";
import { Action } from "../../../../global/LeftNav/styles";
import Button from "../../../../global/common/Button";

interface Props {
  isVisible?: boolean;
  onClose: () => void;
  onNew: () => void;
}

const AssetModal: FC<Props> = ({ onClose, onNew, isVisible }) => {
  const [project, setProject] = useState("Name");
  const [selectIsOpen, setSelectIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [assets, setAssets] = useState<number[]>([]);

  const onChangeAssets = (value: number) => {
    setAssets((state) => {
      if (state.includes(value)) {
        return state.filter((item) => item !== value);
      }
      return [...state, value];
    });
  };

  const chooseProject = (name: string) => {
    setProject(name);
    setSelectIsOpen(false);
  };

  return (
    <MainModal
      isVisible={!!isVisible}
      onClose={onClose}
      title="Assets"
      variant="big"
    >
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search for an asset"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle fill="rgba(115, 128, 148, 0.5)" />}
          value={searchValue}
        />
      </SearchWrapper>
      <AssetsWrapper>
        <AssetsHeader>
          <div>Asset</div>
          <div>Include</div>
          <div>Exclude</div>
        </AssetsHeader>
        {Array(10)
          .fill("")
          .map((item, i) => {
            return (
              <AssetRow onClick={() => onChangeAssets(i)}>
                <div>
                  <UserAvatar
                    size="otc"
                    variant="default"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                  />
                  <div>
                    <p>Ordinex</p>
                    <span>Ord</span>
                  </div>
                </div>
                <AssetCheckboxes>
                  <Checkbox
                    checked={assets.includes(i)}
                    onChange={() => onChangeAssets(i)}
                  />
                </AssetCheckboxes>
                <AssetCheckboxes>
                  <Checkbox
                    checked={assets.includes(i)}
                    onChange={() => onChangeAssets(i)}
                  />
                </AssetCheckboxes>
              </AssetRow>
            );
          })}
      </AssetsWrapper>
      <CreateAssetWrapper>
        <div>Or add your own custom asset</div>
        <Button variant="primary">Create Asset</Button>
      </CreateAssetWrapper>
      <Actions>
        <Action onClick={() => onClose()} actionType="red">
          Cancel
        </Action>
        <Button
          onClick={() => {
            onClose();
          }}
          variant="primary"
        >
          Apply
        </Button>
      </Actions>
      <ResetButton>
        <button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="12"
            viewBox="0 0 13 12"
            fill="none"
          >
            <path
              d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Reset</span>
        </button>
      </ResetButton>
    </MainModal>
  );
};

export default AssetModal;
