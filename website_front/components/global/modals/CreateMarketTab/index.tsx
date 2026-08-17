import React, { FC, useContext } from "react";
import MainModal from "../../common/MainModal";
import { Wrapper } from "./styles";
import InitialStep from "./steps/initialStep";
import { TabHubModalContext } from "../../../layouts/projects/CryptoMarket/tabHub";
import CreateTabSettingsModal from "../../../layouts/projects/CryptoMarket/createTabContext";

interface IProps {
  onCreate: (createdTab?: any) => Promise<void>;
}

const CreateMarketTab: FC<IProps> = ({ onCreate }) => {
  const { isTabSettings, setIsTabSettings, settingsSection } =
    useContext(TabHubModalContext);

  return (
    <CreateTabSettingsModal
      isVisible={isTabSettings}
      initialSection={settingsSection}
      setIsVisible={setIsTabSettings}
      onCreate={onCreate}
    />
  );
};

export default CreateMarketTab;
