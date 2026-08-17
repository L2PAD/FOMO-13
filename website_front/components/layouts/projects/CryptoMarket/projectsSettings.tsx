import React, { createContext, FC, useState } from "react";
import CustomizeTabModal from "../modals/CustomizeTabModal";
import { ICustomTabs } from "../../../../staticContent/tabs";
import AssetModal from "../modals/AssetModal";
import CustomizeTabBody from "../modals/CustomizeTabModal/CustomizeTabBody";
import MainModal from "../../../global/common/MainModal";
import AssetModalBody from "../modals/AssetModal/AssetModalBody";
import Tabs from "../../../global/Tabs";
import CreateOwnAsset from "../modals/CreateOwnAsset";
import UniversalFilterBody from "../../../global/UniversalFilter/UniversalFilterBody";
import { cryptoMarketFilter } from "../../../../staticContent/projects/crypto_market";
import { ProjectsSettingsTabs } from "./styles";

export type ProjectSettingsSections = "Filter" | "Customize Tab" | "Assets";

interface IProps {
  isVisible: boolean;
  initialSection: ProjectSettingsSections;
  setIsVisible: (isVisible: boolean) => void;
}

export const ProjectsSettingsContext = createContext<IProps>({
  isVisible: false,
  initialSection: "Filter",
  setIsVisible: (isVisible: boolean) => {},
});

const ProjectsSettingsModalContext: FC<IProps> = ({
  isVisible,
  initialSection,
  setIsVisible,
}) => {
  const [isCreateAsset, setIsCreateAsset] = useState<boolean>(false);
  const [settingsSections, setSettingsSections] =
    useState<ProjectSettingsSections | null>(null);

  // const getModalBody = (): React.ReactNode => {
  //     const modalBodies = {
  //         'Filter': <UniversalFilterBody
  //             filters={cryptoMarketFilter}
  //             onChange={(data: any) => console.log(data)}
  //         />,
  //         'Customize Tab': <CustomizeTabBody
  //             onClose={() => setIsVisible(false)}
  //             tabs={[]}
  //             onChange={(tabs: Array<ICustomTabs & { blockName: string }>) => console.log('test')}
  //         />,
  //         'Assets': <AssetModalBody
  //             onClose={() => setIsVisible(false)}
  //             onNew={() => setIsCreateAsset(true)}
  //         />
  //     }

  //     return modalBodies[settingsSections || initialSection]
  // }

  return (
    <ProjectsSettingsContext.Provider
      value={{
        isVisible,
        setIsVisible,
        initialSection,
      }}
    >
      {isCreateAsset ? (
        <CreateOwnAsset
          isVisible={isCreateAsset}
          onClose={() => setIsCreateAsset(false)}
          onModalBack={() => {
            setIsCreateAsset(false);
            setIsVisible(true);
          }}
        />
      ) : (
        <MainModal
          variant="big"
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
          title={settingsSections || initialSection}
        >
          <ProjectsSettingsTabs>
            <Tabs
              className="main"
              items={["Filter", "Customize Tab", "Assets"]}
              activeItem={settingsSections || initialSection}
              onClick={(value: any) => setSettingsSections(value)}
            />
          </ProjectsSettingsTabs>
          {/* {getModalBody()} */}
        </MainModal>
      )}
    </ProjectsSettingsContext.Provider>
  );
};

export default ProjectsSettingsModalContext;
