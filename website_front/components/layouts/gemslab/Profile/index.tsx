/* eslint-disable */
import React, { useContext, useState } from "react";
import { AuthContext } from "../../../global/Layout";
import Tabs from "../../../global/Tabs";
import CreatingProjectModal from "../../../global/modals/creating_project";
import SupportModal from "../../../global/modals/SupportModal";
import ConnectAuthenticatorModal from "../../../global/modals/ConnectAuthenticatorModal";
import Settings from "./Settings";
import { PageWrapper } from "../../projects/CryptoMarket/styles";
import UserActivity from "./UserActivity";
import MyDeals from "./MyDeals";
import Calendar from "../../projects/Calendar";
import UserTasks from "./Tasks";
import { PROFILE_TABS } from "./constants";
import ProfileHeader from "./components/ProfileHeader";
import ProfileMainInfo from "./components/ProfileMainInfo";
import { useProfileActions } from "./hooks/useProfileActions";
import { useProfileViewState } from "./hooks/useProfileViewState";
export type { IDescriptionModals } from "./types";

const Profile = () => {
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [hideStepsModal, setHideStepsModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [connectAuthenticatorModal, setConnectAuthenticatorModal] =
    useState(false);
  const { userData } = useContext(AuthContext);
  const {
    activeTab,
    closeBadgesPopover,
    closeHighlightsPopover,
    descriptionModals,
    isActionsPopoverOpen,
    isBadgesPopoverOpen,
    isHighlightsPopoverOpen,
    isMobile,
    isSocialsPopoverOpen,
    updateActiveTab,
    setDescriptionModalVisibility,
    toggleActionsPopover,
    closeActionsPopover,
    toggleBadgesPopover,
    toggleHighlightsPopover,
    toggleSocialsPopover,
    closeSocialsPopover,
  } = useProfileViewState();
  const { copyReferralLink, copyWallet, copyFomoId, openClink } =
    useProfileActions(userData);

  const renderContent = () => {
    switch (activeTab) {
      case "Activity":
        return <UserActivity />;
      case "My Deals":
        return <MyDeals />;
      case "Tasks":
        return <UserTasks />;
      case "Settings":
        return <Settings />;
      case "Calendar":
        return <Calendar isProfile={true} />;
    }
  };

  return (
    <PageWrapper>
      <ProfileHeader
        isActionsPopoverOpen={isActionsPopoverOpen}
        isBadgesPopoverOpen={isBadgesPopoverOpen}
        isHighlightsPopoverOpen={isHighlightsPopoverOpen}
        isMobile={isMobile}
        isSocialsPopoverOpen={isSocialsPopoverOpen}
        onCloseActionsPopover={closeActionsPopover}
        onCloseBadgesPopover={closeBadgesPopover}
        onCloseHighlightsPopover={closeHighlightsPopover}
        onCloseSocialsPopover={closeSocialsPopover}
        onCopyFomoId={copyFomoId}
        onCopyReferralLink={copyReferralLink}
        onOpenClink={openClink}
        onOpenSupport={() => setSupportModal(true)}
        onToggleActionsPopover={toggleActionsPopover}
        onToggleBadgesPopover={toggleBadgesPopover}
        onToggleHighlightsPopover={toggleHighlightsPopover}
        onToggleSocialsPopover={toggleSocialsPopover}
        userData={userData}
      />

      <ProfileMainInfo
        descriptionModals={descriptionModals}
        onCopyWallet={copyWallet}
        onDescriptionModalChange={setDescriptionModalVisibility}
        userData={userData}
      />
      <br />
      <br />

      <Tabs
        className="big"
        items={PROFILE_TABS}
        activeItem={activeTab}
        onClick={updateActiveTab}
      />
      {renderContent()}

      <div style={{ display: hideStepsModal ? "none" : "block" }}>
        {isCreatingModal && (
          <CreatingProjectModal onClose={() => setIsCreatingModal(false)} />
        )}
      </div>

      <SupportModal
        isVisible={supportModal}
        onClose={() => setSupportModal(false)}
      />

      {/* {twoFAModal && <TwoFAModal onClose={() => setTwoFAModal(false)} />} */}
      {connectAuthenticatorModal && (
        <ConnectAuthenticatorModal
          onClose={() => setConnectAuthenticatorModal(false)}
        />
      )}
    </PageWrapper>
  );
};

export default Profile;
