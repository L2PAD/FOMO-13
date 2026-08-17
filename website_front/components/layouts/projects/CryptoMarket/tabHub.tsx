import React, { createContext, FC, useContext, useState } from "react";
import TabHubModal from "../../../global/modals/TabHub";
import DeleteModal from "../../../global/modals/DeleteModal";
import CreateMarketTab from "../../../global/modals/CreateMarketTab";
import CreateOwnAsset from "../modals/CreateOwnAsset";
import { ProjectSettingsSections } from "./createTabContext";
import { useQuery } from "react-query";
import { AuthContext, LoadingContext } from "../../../global/Layout";
import { toast } from "react-toastify";
import deleteTab from "../../../../http/tabhub/deleteTab";
import { useTranslation } from "i18n";

interface ITabProps {
  isMainModal: boolean;
  isDeleteModal: boolean;
  isCreateTab: boolean;
  isCreateOwnAsset: boolean;
  isTabSettings: boolean;
  isUpdateTab: boolean;
  settingsSection: ProjectSettingsSections;
  tab: any | null;
  setIsUpdateTab: (isVisible: boolean) => void;
  setIsMainModal: (isVisible: boolean) => void;
  setIsDeleteModal: (isVisible: boolean) => void;
  setIsCreateTab: (isVisible: boolean) => void;
  setTab: (tab: any) => void;
  setIsCreateOwnAsset: (isVisible: boolean) => void;
  setIsTabSettings: (isVisible: boolean) => void;
  setSettingsSection: (value: ProjectSettingsSections) => void;
}

export const TabHubModalContext = createContext<ITabProps>({
  isMainModal: false,
  isDeleteModal: false,
  isCreateTab: false,
  isCreateOwnAsset: false,
  isTabSettings: false,
  isUpdateTab: false,
  settingsSection: "Assets",
  tab: null,
  setIsMainModal: (isVisible: boolean) => {},
  setIsUpdateTab: (isVisible: boolean) => {},
  setIsDeleteModal: (isVisible: boolean) => {},
  setIsCreateTab: (isVisible: boolean) => {},
  setTab: (tab: any) => {},
  setIsCreateOwnAsset: (isVisible: boolean) => {},
  setIsTabSettings: (isVisible: boolean) => {},
  setSettingsSection: (value: ProjectSettingsSections) => {},
});

interface IProps {
  isMainModal: boolean;
  setIsMainModal: (value: boolean) => void;
}

const TabHubContext: FC<IProps> = ({ isMainModal, setIsMainModal }) => {
  const { translateText } = useTranslation();
  const { userData } = useContext(AuthContext);
  const [selectedTabHub, setSelectedTabHub] = useState<any | null>(null);
  const [isDeleteModal, setIsDeleteModal] = useState<boolean>(false);
  const [isCreateTab, setIsCreateTab] = useState<boolean>(false);
  const [isCreateOwnAsset, setIsCreateOwnAsset] = useState<boolean>(false);
  const [isTabSettings, setIsTabSettings] = useState<boolean>(false);
  const [isUpdateTab, setIsUpdateTab] = useState<boolean>(false);
  const [settingsSection, setSettingsSection] =
    useState<ProjectSettingsSections>("Assets");

  const openNewTabModal = (): void => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Full authorization is required to create your own tab.")}</h3>
        </div>
      );
      return;
    }

    setIsCreateTab(true);
    setIsTabSettings(true);
    setIsMainModal(false);
  };

  return (
    <TabHubModalContext.Provider
      value={{
        isCreateTab,
        isMainModal,
        isDeleteModal,
        isCreateOwnAsset,
        isTabSettings,
        settingsSection,
        isUpdateTab,
        tab: selectedTabHub,
        setIsMainModal,
        setIsDeleteModal,
        setIsCreateTab,
        setIsCreateOwnAsset,
        setIsTabSettings,
        setSettingsSection,
        setIsUpdateTab,
        setTab: setSelectedTabHub,
      }}
    >
      <TabHubModal
        isVisible={isMainModal}
        onClose={() => setIsMainModal(false)}
        openNewTabModal={openNewTabModal}
      />
    </TabHubModalContext.Provider>
  );
};

export default TabHubContext;
