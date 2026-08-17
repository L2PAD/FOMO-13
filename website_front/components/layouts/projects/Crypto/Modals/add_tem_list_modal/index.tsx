import React, { FC, useCallback, useState } from "react";
import { useQuery } from "react-query";
import fetchPersons from "../../../../../../http/persons/fetchPersons";
import Modal from "../../../../../global/common/Modal";
import {
  SearchIcon,
  CheckIcon,
  UncheckIcon,
} from "../../../../../global/Icons";
import {
  SearchInput,
  SearchWrapper,
  UserData,
  UserRow,
  UsersWrapper,
} from "./styles";
import avatarImage from "../../../../../assets/img/avatar.png";
import { SubmitButton } from "../../../modals/CreateTopicModal/styles";
import { Investor } from "../../../../../../types/global_types";
import imageLoader from "../../../../../../helpers/imageLoader";

interface Props {
  label: string;
  onClose: () => void;
  participantsHandler: (key: string, items: Array<any>) => void;
}

const AddTeamListModal: FC<Props> = ({
  onClose,
  label,
  participantsHandler,
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<
    Array<Investor>
  >([]);
  const { data } = useQuery("persons", fetchPersons);

  const toggleInvestor = useCallback(
    (investor: Investor) => {
      if (selectedParticipants.find((inv) => inv._id === investor._id)) {
        return setSelectedParticipants((prev) =>
          prev.filter((inv) => inv._id !== investor._id)
        );
      }
      setSelectedParticipants((prev) => {
        return [...prev, { ...investor, selected: !investor.selected }];
      });
    },
    [selectedParticipants]
  );

  const confirmParticipants = () => {
    participantsHandler(label.toLowerCase(), selectedParticipants);
    onClose();
  };

  return (
    <Modal
      title={`Add ${label.toLowerCase()}`}
      onClose={onClose}
      variant="small"
    >
      <SearchWrapper>
        <SearchIcon />
        <SearchInput type="text" placeholder="Search" />
      </SearchWrapper>
      <UsersWrapper>
        {data?.persons?.length ? (
          data.persons.map((investor: any) => {
            return (
              <UserRow
                onClick={() => toggleInvestor(investor)}
                key={investor._id}
              >
                {selectedParticipants.find(
                  (inv) => inv._id === investor._id
                ) ? (
                  <CheckIcon fill="#04A584" />
                ) : (
                  <UncheckIcon />
                )}
                <UserData>
                  <img
                    src={imageLoader(String(investor.logo))}
                    alt={investor.name}
                  />
                  {investor.name}
                </UserData>
              </UserRow>
            );
          })
        ) : (
          <></>
        )}
      </UsersWrapper>
      <SubmitButton onClick={confirmParticipants}>
        Add {selectedParticipants.length} persons
      </SubmitButton>
    </Modal>
  );
};

export default AddTeamListModal;
