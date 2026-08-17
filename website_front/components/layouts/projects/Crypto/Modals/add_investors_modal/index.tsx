import React, { FC, useState, useEffect, useCallback } from "react";
import Modal from "../../../../../global/common/Modal";
import {
  CheckIcon,
  SearchIcon,
  UncheckIcon,
} from "../../../../../global/Icons";
import {
  SearchInput,
  SearchWrapper,
  UserData,
  UserRow,
  UsersWrapper,
} from "./styles";
import { SubmitButton } from "../../../modals/AddFundsModal/styles";
import { IProject, Investor } from "../../../../../../types/global_types";
import imageLoader from "../../../../../../helpers/imageLoader";
import Loader from "../../../../../global/loader";
import { useQuery } from "react-query";
import fetchFunds from "../../../../../../http/funds/fetchFunds";

interface IProps {
  onClose: () => void;
  addInvestors: (key: string, investors: Array<any>) => void;
  data: IProject;
}

const AddInvestorsModal: FC<IProps> = ({ onClose, addInvestors, data }) => {
  const result = useQuery("funds", fetchFunds);
  const [investors, setInvestors] = useState<Array<any>>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<Array<Investor>>(
    []
  );

  const toggleInvestor = useCallback(
    (investor: Investor) => {
      if (selectedInvestors.find((inv) => inv._id === investor._id)) {
        return setSelectedInvestors((prev) =>
          prev.filter((inv) => inv._id !== investor._id)
        );
      }
      setSelectedInvestors((prev) => {
        return [...prev, { ...investor, selected: !investor.selected }];
      });
    },
    [selectedInvestors]
  );

  const confirmInvestors = () => {
    addInvestors("investors", selectedInvestors);
    onClose();
  };

  useEffect(() => {
    setInvestors(result?.data?.funds || []);
  }, [result]);

  if (result.isLoading) return <Loader isVisible />;

  return (
    <Modal title="Add investors" onClose={onClose} variant="small">
      <SearchWrapper>
        <SearchIcon />
        <SearchInput type="text" placeholder="Search" />
      </SearchWrapper>
      <UsersWrapper>
        {investors ? (
          investors.map((investor) => {
            return (
              <UserRow
                onClick={() => toggleInvestor(investor)}
                key={investor._id}
              >
                {selectedInvestors.find((inv) => inv._id === investor._id) ? (
                  <CheckIcon fill="#04A584" />
                ) : (
                  <UncheckIcon />
                )}
                <UserData>
                  <img src={imageLoader(investor.logo)} alt={investor.name} />
                  {investor.name}
                </UserData>
              </UserRow>
            );
          })
        ) : (
          <></>
        )}
      </UsersWrapper>
      <SubmitButton onClick={confirmInvestors}>
        Add {selectedInvestors.length} investors
      </SubmitButton>
    </Modal>
  );
};

export default AddInvestorsModal;
