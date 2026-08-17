import React, { createContext, FC, useContext, useState } from "react";
import CustomizeTabModal from "../modals/CustomizeTabModal";
import { ICustomTabs } from "../../../../staticContent/tabs";
import AssetModal from "../modals/AssetModal";
import CustomizeTabBody from "../modals/CustomizeTabModal/CustomizeTabBody";
import MainModal from "../../../global/common/MainModal";
import AssetModalBody from "../modals/AssetModal/AssetModalBody";
import Tabs from "../../../global/Tabs";
import CreateOwnTab, { IOwnTabData } from "../modals/CreateOwnTab";
import UniversalFilterBody from "../../../global/UniversalFilter/UniversalFilterBody";
import { cryptoMarketFilter } from "../../../../staticContent/projects/crypto_market";
import { ProjectsSettingsTabs } from "./styles";
import CreateOwnAsset from "../modals/CreateOwnAsset";
import { TabHubModalContext } from "./tabHub";
import { IGlobalAsset, IUser } from "../../../../types/global_types";
import createTab from "../../../../http/tabhub/createTab";
import { AuthContext, LoadingContext } from "../../../global/Layout";
import { toast } from "react-toastify";
import { useTranslation } from "i18n";

export type ProjectSettingsSections = "Assets" | "Customize Tab";

interface IProps {
  isVisible: boolean;
  initialSection: ProjectSettingsSections;
  setIsVisible: (isVisible: boolean) => void;
  onCreate: (createdTab?: ICryptoTab | null) => Promise<void>;
}

export interface ITabStepsData {
  includedAssets: Array<string>;
  excludedAssets: Array<string>;
  tabs: Array<ICustomTabs & { blockName: string }>;
  name: string;
  description: string;
  image?: string | null;
}

export interface ICryptoTab extends ITabStepsData {
  _id?: string;
  key?: string;
  saved: Array<string>;
  pined: Array<string>;
  status?: "New" | "Trending";
  type?: string;
  dateUpdate?: Date;
  creator?: Partial<IUser> & { _id?: string };
  arrayPlace?: number;
  isPublic?: boolean;
  isActive?: boolean;
  isGlobal?: boolean;
  isAdminCreated?: boolean;
  sortOrder?: number;
  columns?: Array<{
    key: string;
    label: string;
    enabled: boolean;
    order: number;
    blockName?: string;
    name?: string;
  }>;
  filters?: Record<string, any>;
  isSaved?: boolean;
  isPinned?: boolean;
  isCreator?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CreateTabContext = createContext<IProps>({
  isVisible: false,
  initialSection: "Assets",
  setIsVisible: (isVisible: boolean) => {},
  onCreate: async () => {},
});

const CreateTabSettingsModal: FC<IProps> = ({
  isVisible,
  initialSection,
  setIsVisible,
  onCreate,
}) => {
  const { translateText } = useTranslation();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { setIsMainModal, setIsCreateTab: setIsCreateTabFlow } =
    useContext(TabHubModalContext);
  const [isCreateTab, setIsCreateTab] = useState<boolean>(false);
  const [settingsSections, setSettingsSections] =
    useState<ProjectSettingsSections | null>("Assets");
  const [tabData, setTabData] = useState<ITabStepsData>({
    includedAssets: [],
    excludedAssets: [],
    tabs: [],
    name: "",
    description: "",
    image: null,
  });

  const getModalBody = (): React.ReactNode => {
    const modalBodies = {
      Assets: (
        <AssetModalBody
          description={`
                ${translateText("Design your personalized crypto tracker tab. Choose the specific crypto assets you want to track in this tab. You can include or exclude tokens based on your preferences to create a focused and personalized view.")}
            `}
          buttonText={translateText("Continue")}
          onConfirm={(
            includedAssets: Array<string>,
            excludedAssets: Array<string>
          ) => {
            setSettingsSections("Customize Tab");
            setTabData((prev: ITabStepsData) => {
              return { ...prev, includedAssets, excludedAssets };
            });
          }}
          onClose={() => {
            setIsVisible(false);
            setIsMainModal(true);
            setSettingsSections("Assets");
          }}
        />
      ),
      "Customize Tab": (
        <CustomizeTabBody
          description={translateText("Design your personalized crypto tracker tab. Choose the specific crypto assets you want to track in this tab. You can include or exclude tokens based on your preferences to create a focused and personalized view.")}
          buttonText={translateText("Continue")}
          leftButtonText={translateText("Back")}
          onClose={() => setSettingsSections("Assets")}
          onConfirm={(items: Array<ICustomTabs & { blockName: string }>) => {
            setTabData((prev: ITabStepsData) => {
              return { ...prev, tabs: items };
            });
            setIsCreateTab(true);
          }}
        />
      ),
    };

    return modalBodies[settingsSections || initialSection];
  };

  const getModalTitle = (): React.ReactNode => {
    if (settingsSections === "Assets") {
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: "var(--font-weight-semibold)" }}>
            {translateText("New Tab: Customize Your Ultimate Crypto Tracker")}
          </span>
          <span
            style={{
              fontSize: "24px",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--main-gray)",
            }}
          >
            1/3
          </span>
        </div>
      );
    }
    if (settingsSections === "Customize Tab") {
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: "var(--font-weight-semibold)" }}>
            {" "}
            {translateText("Customize Tab")}
          </span>
          <span
            style={{
              fontSize: "24px",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--main-gray)",
            }}
          >
            2/3
          </span>
        </div>
      );
    }
  };

  const confirmCreateTab = async (assetData: IOwnTabData): Promise<void> => {
    if (!userData._id) return;

    loadingStateHandler(true);
    const newTab: ICryptoTab = {
      ...tabData,
      ...assetData,
      saved: [],
      pined: [],
    };

    const { isSuccess, tab } = await createTab(newTab);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Tab created")}</p>
        </div>
      );
      setIsCreateTab(false);
      setIsVisible(false);
      setIsCreateTabFlow(false);

      await onCreate(tab);
    } else {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("Something went wrong")}</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  return (
    <CreateTabContext.Provider
      value={{
        isVisible,
        initialSection,
        setIsVisible,
        onCreate,
      }}
    >
      {isCreateTab ? (
        <CreateOwnTab
          isVisible={isCreateTab}
          onClose={() => setIsCreateTab(false)}
          onConfirm={confirmCreateTab}
        />
      ) : (
        <MainModal
          variant="big"
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
          title=""
          CustomTitle={getModalTitle()}
          customTitleClassName="steps-title"
        >
          {getModalBody()}
        </MainModal>
      )}
    </CreateTabContext.Provider>
  );
};

export default CreateTabSettingsModal;
