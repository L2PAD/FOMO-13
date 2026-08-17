import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import MainModal from "../../../../global/common/MainModal";
import { Button } from "../../../../global/common/Button";
import { Action } from "../../../../global/LeftNav/styles";
import { Actions } from "../../../../global/common/UniversalTable/styles";
import {
  BlockWrapper,
  InputError,
  InputLabel,
  InputWrapper,
} from "../CreatePortfolio/styles";
import { ResetButton } from "../../../../global/UniversalFilter/styles";
import SearchProject from "../../../../global/SearchProject";
import { IParcingTwitterAcc, IProject } from "../../../../../types/global_types";
import SearchParsingAccounts from "../../../../global/SearchParsingAccounts";
import TwitterAccs from "../../Parsing/TwitterAccs";
import EntityInfo from "../../../../global/common/EntityInfo";
import OptionIcon from "../../../../global/Icons/OptionIcon";
import SearchParsingKeywords from "../../../../global/SearchParsingKeywords";
import createTradingTrend from "../../../../../http/trading/createTradingTrend";
import { LoadingContext } from "../../../../global/Layout";
const Items = styled.ul`
  margin-top: 5px;
  display: flex;
  flex-wrap:wrap;
  gap: 4px;
`;

const Item = styled.button`
  width: 100%;
  background: #fff;
  padding: 7px;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: var(--input-hover);
  }
  &:active {
    background: var(--input-active);
  }
`;
const Wrapper = styled.div`
  width: 100%;
  & .actions-wrapper {
    button {
      max-width: 50%;
      width: 50%;
    }
  }
`;

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  accounts: any[]

}

export type TradingForm = {
  coinId: string;
  name: string;
  logo?: string;
  isPrivate: boolean;
};

const CreateTradingModal: FC<IProps> = ({ isVisible, onClose, accounts }) => {
  const { loadingStateHandler } = useContext(LoadingContext)
  const [selectedAccs, setSelectedAccs] = useState<Array<any>>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Array<{ id: string, keyword: string }>>([]);
  const [project, setProject] = useState<IProject | null>(null)
  const [form, setForm] = useState<TradingForm>({
    coinId: "",
    name: "",
    logo: "",
    isPrivate: false,
  });
  const [isError, setIsError] = useState(false);

  const closeModal = (): void => {
    onClose();
    setTimeout(() => {
      setForm({ coinId: "", name: "", logo: "", isPrivate: false });
    }, 300);
  };

  const toggleAccount = (item: IParcingTwitterAcc): void => {
    if (selectedAccs.find((acc: IParcingTwitterAcc) => acc._id === item._id)) {
      setSelectedAccs((accounts: Array<IParcingTwitterAcc>) => {
        return accounts.filter((selectedAcc: IParcingTwitterAcc) => {
          return selectedAcc._id !== item._id;
        });
      });
      return;
    }

    const updatedAccs: Array<any> = [item, ...selectedAccs];

    setSelectedAccs(updatedAccs);
  };

  const toggleKeywords = (item: { id: string; keyword: string }): void => {
    const exists = selectedKeywords.find((keyW) => keyW.id === item.id);

    if (exists) {
      setSelectedKeywords((items) => items.filter((selectedKey) => selectedKey.id !== item.id));
    } else {
      setSelectedKeywords((items) => [item, ...items]);
    }
  };


  const handleSave = async (): Promise<void> => {
    if (!project) {
      setIsError(true);
      setTimeout(() => setIsError(false), 4000);
      return;
    }

    try {
      loadingStateHandler(true)
      setSelectedAccs([])
      setSelectedKeywords([])
      setProject(null)
      await createTradingTrend({
        projectId: project?._id || '',
        twitterAccs: selectedAccs.map((item: any) => item._id),
        keywords: selectedKeywords.map((item: any) => item.id),
      });
      toast.success("Token Track Created!");
      closeModal();
    } catch (e) {
      toast.error("Error on creating Track");
    }
    loadingStateHandler(false)

  };

  return (
    <MainModal
      title=""
      className="share-modal"
      variant="650"
      isVisible={isVisible}
      onClose={closeModal}
      CustomTitle={<div className="custom-title">Track Token</div>}
    >
      <Wrapper>
        <BlockWrapper>
          <InputWrapper>
            <SearchProject
              label=""
              onChange={(project) => setProject(project)}
            />
          </InputWrapper>
        </BlockWrapper>
        <BlockWrapper>
          <InputLabel>Accounts</InputLabel>
          <br />
          <SearchParsingAccounts
            subtype="sentiment"
            selectedItems={selectedAccs}
            onChange={toggleAccount}
            type="/user"
            className="search-acc-input"
          />
          <Items>
            {selectedAccs.map((item: any) => {
              return (
                <Item
                  onClick={() => {
                    toggleAccount(item);
                  }}
                  key={item._id}
                >
                  <OptionIcon label="2" value="1" isActive={true} />
                  <EntityInfo
                    img={item.avatar}
                    name={item.name || item.username}
                    username={item.username}
                    variant="default"
                  />
                </Item>
              );
            })}
          </Items>
          <br />
        </BlockWrapper>
        <BlockWrapper>
          <InputLabel>Keywords</InputLabel>
          <br />
          <SearchParsingKeywords
            subtype="sentiment"
            selectedItems={selectedKeywords}
            onChange={toggleKeywords}
            type="/user"
            className="search-acc-input"
          />
          <Items>
            {selectedKeywords.map((item: { id: string, keyword: string }) => {
              return (
                <Item
                  onClick={() => {
                    toggleKeywords(item);
                  }}
                  key={item.id}
                >
                  <OptionIcon label="2" value="1" isActive={true} />
                  {item.keyword}
                </Item>
              );
            })}
          </Items>
          <br />
        </BlockWrapper>
        <Actions className="actions-wrapper" style={{ marginTop: "50px" }}>
          <Action onClick={closeModal} actionType="red">
            Cancel
          </Action>
          <Button onClick={handleSave} variant="primary">
            Save
          </Button>
        </Actions>

        <ResetButton>
          <button
            onClick={() =>
              setForm({ coinId: "", name: "", logo: "", isPrivate: false })
            }
          >
            Reset
          </button>
        </ResetButton>
      </Wrapper>
    </MainModal>
  );
};

export default CreateTradingModal;
