/* eslint-disable */
import React, { useContext, useState } from "react";
import { AuthContext } from "../Layout";
import AuthModal from "../modals/AuthModal";
import SupportModal from "../modals/SupportModal";
import MultiWalletModal from "../modals/MultiWalletModal";
import CreatingProjectModal from "../modals/creating_project";
import CreateNewsModal from "../modals/create_news_modal";
import CreatePersonModal from "../modals/creating_person";
import CreateFundModal from "../modals/creating_fund";
import { UserWrapper } from "./styles";
import UserDropdownButton from "./UserDropdownButton";
import UserDropdownPanel from "./UserDropdownPanel";

interface Props {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserDropdown = ({ isOpen, setIsOpen }: Props) => {
  const { userData } = useContext(AuthContext);
  const [authModal, setAuthModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [multiWalletModal, setMultiWalletModal] = useState(false);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [isCreatePerson, setIsCreatePerson] = useState(false);
  const [isCreateFund, setIsCreateFund] = useState(false);
  const [isNewsModal, setIsNewsModal] = useState(false);
  const [hideStepsModal, setHideStepsModal] = useState(false);

  return (
    <>
      <UserWrapper>
        <UserDropdownButton
          userData={userData}
          onClick={() => setIsOpen(true)}
        />
      </UserWrapper>

      {authModal && <AuthModal onClose={() => setAuthModal(false)} />}
      <SupportModal
        isVisible={supportModal}
        onClose={() => setSupportModal(false)}
      />
      {multiWalletModal && (
        <MultiWalletModal onClose={() => setMultiWalletModal(false)} />
      )}

      <div style={{ display: hideStepsModal ? "none" : "block" }}>
        {isCreatingModal ? (
          <CreatingProjectModal onClose={() => setIsCreatingModal(false)} />
        ) : (
          <></>
        )}
        {isNewsModal ? (
          <CreateNewsModal onClose={() => setIsNewsModal(false)} />
        ) : (
          <></>
        )}
        {isCreatePerson ? (
          <CreatePersonModal onClose={() => setIsCreatePerson(false)} />
        ) : (
          <></>
        )}
        {isCreateFund ? (
          <CreateFundModal onClose={() => setIsCreateFund(false)} />
        ) : (
          <></>
        )}
      </div>

      <UserDropdownPanel
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onOpenAuthModal={() => setAuthModal(true)}
        onOpenSupportModal={() => setSupportModal(true)}
        onOpenMultiWalletModal={() => setMultiWalletModal(true)}
        onOpenCreateProject={() => setIsCreatingModal(true)}
        onOpenCreatePerson={() => setIsCreatePerson(true)}
        onOpenCreateFund={() => setIsCreateFund(true)}
        onOpenCreateNews={() => setIsNewsModal(true)}
      />
    </>
  );
};

export default UserDropdown;
