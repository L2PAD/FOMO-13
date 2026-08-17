import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import {
  SearchIconStyle,
  SearchInput,
} from "../../../gemslab/Portfolio/Analytics/styles";
import { CheckIcon } from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import UsersRow from "../../../../global/UsersRow";
import { usersList } from "../../../../../staticContent/global";
import Typography from "../../../../global/common/Typography";
import {
  FundDataWrapper,
  FundRow,
  FundsWrapper,
  HeaderWrapper,
  ProjectsWrapper,
  SubmitButton,
} from "./styles";

interface Props {
  onClose: () => void;
  onSubmit: () => void;
}

const AddFundsModal: FC<Props> = ({ onClose, onSubmit }) => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <Modal title="Add fund" onClose={onClose} variant="small-medium">
      <HeaderWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
        <button>+ Create new fund</button>
      </HeaderWrapper>
      <FundsWrapper>
        {Array(5)
          .fill("")
          .map((item, i) => {
            return (
              <FundRow key={i + item}>
                <div>
                  <CheckIcon fill="#04A584" />
                </div>
                <FundDataWrapper>
                  <UserAvatar
                    size="small"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                    variant="default"
                  />
                  <Typography variant="p">Dr. Laurent El Ghaul</Typography>
                </FundDataWrapper>
                <ProjectsWrapper>
                  <UsersRow users={usersList} />
                  <p>
                    Total: <span>94 projects</span>
                  </p>
                </ProjectsWrapper>
              </FundRow>
            );
          })}
      </FundsWrapper>
      <SubmitButton onClick={onSubmit}>Add 5 funds</SubmitButton>
    </Modal>
  );
};

export default AddFundsModal;
