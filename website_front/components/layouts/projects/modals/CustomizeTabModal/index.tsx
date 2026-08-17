import React, { FC, useMemo, useState } from "react";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import { CloseIcon, VerticalDotsIcon } from "../../../../global/Icons";
import { draggableTables } from "../../../../../staticContent/global";
import {
  CustomTabsDefault,
  ICustomTabs,
} from "../../../../../staticContent/tabs";
import {
  ActionsWrapper,
  Body,
  CheckboxesWrapper,
  LeftColumn,
  RightColumn,
  TableRow,
  TablesWrapper,
} from "./styles";
import MainModal from "../../../../global/common/MainModal";
import {
  ResetButton,
  Actions,
} from "../../../../global/UniversalFilter/styles";
import { Action } from "../../../../global/LeftNav/styles";
import Button from "../../../../global/common/Button";
import CustomizeTabBody from "./CustomizeTabBody";
import UpdateCustomizeTabBody from "./UpdateTabBody";

interface Props {
  tabName?: string;
  tabs: Array<ICustomTabs>;
  isVisible?: boolean;
  onChange: (tabs: Array<ICustomTabs>) => void;
  onClose: () => void;
}

const CustomizeTabModal: FC<Props> = ({
  tabName,
  tabs,
  isVisible,
  onClose,
  onChange,
}) => {
  return (
    <MainModal
      isVisible={!!isVisible}
      variant="big"
      title={`Customize Tab - ${tabName}`}
      onClose={onClose}
    >
      <UpdateCustomizeTabBody
        tabsInitial={tabs}
        onConfirm={onChange}
        onClose={onClose}
      />
    </MainModal>
  );
};

export default CustomizeTabModal;
