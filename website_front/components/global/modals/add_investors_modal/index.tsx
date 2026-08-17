/* eslint-disable */
import React, { FC, useMemo, useState } from "react";
import useFetch from "../../../../hooks/useFetch";
import { CheckIcon, SearchIcon } from "../../Icons";
import Modal from "../../common/Modal";
import { SubmitButton } from "../KYCModal/styles";
import {
  SearchInput,
  SearchWrapper,
  UserData,
  UserRow,
  UsersWrapper,
} from "./styles";
import { Investor } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";

interface Props {
  selectedInvestors: Investor[];
  onClose: () => void;
  addInvestors: (investor: Investor) => void;
}

const AddInvestorsModal: FC<Props> = ({
  onClose,
  addInvestors,
  selectedInvestors,
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const { data } = useFetch("funds");

  const filteredInvestors: Array<Investor> = useMemo(() => {
    if (!searchValue && !data?.data) return [];

    return data?.data.filter((investor: Investor) =>
      investor.name.toLowerCase().includes(searchValue)
    );
  }, [data, searchValue]);

  return (
    <Modal title="Add investors" onClose={onClose} variant="small">
      <SearchWrapper>
        <SearchIcon />
        <SearchInput
          onChange={(e) => setSearchValue(e.target.value)}
          type="text"
          placeholder="Search"
        />
      </SearchWrapper>
      <UsersWrapper>
        {filteredInvestors.map((investor: Investor) => {
          const isSelected: boolean = !!selectedInvestors.find(
            (inv: Investor) => inv._id === investor._id
          );
          return (
            <UserRow onClick={() => addInvestors(investor)} tabIndex={0}>
              {isSelected ? <CheckIcon /> : <></>}
              <UserData>
                <img
                  src={
                    typeof investor.logo === "string"
                      ? imageLoader(investor.logo)
                      : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  }
                  alt={investor.name}
                />
                {investor.name}
              </UserData>
            </UserRow>
          );
        })}
      </UsersWrapper>
      <SubmitButton onClick={onClose}>
        Add {selectedInvestors.length} funds
      </SubmitButton>
    </Modal>
  );
};

export default AddInvestorsModal;
