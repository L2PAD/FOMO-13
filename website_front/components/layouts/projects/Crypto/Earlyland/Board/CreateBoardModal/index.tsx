import React, { FC, useState } from "react";
import {
  CancelButton,
  CloseButton,
  CreateButton,
  FieldError,
  FieldInput,
  FieldLabel,
  FormField,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalWrapper,
  Overlay,
} from "./styles";

import { XIcon } from "../../../../../../global/Icons/Earlyland/icons";
import { useTranslation } from "i18n";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}>;

export const CreateBoardModal: FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const { translateText } = useTranslation();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const hasError = touched && name.trim() === "";

  const handleSubmit = () => {
    setTouched(true);
    if (name.trim() === "") return;
    onCreate(name.trim());
    setName("");
    setTouched(false);
    onClose();
  };

  const handleClose = () => {
    setName("");
    setTouched(false);
    onClose();
  };

  return (
    <Overlay onClick={handleClose}>
      <ModalWrapper onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{translateText("Create New Board")}</ModalTitle>
          <CloseButton onClick={handleClose} type="button" aria-label={translateText("Close")}>
            <XIcon />
          </CloseButton>
        </ModalHeader>

        <FormField>
          <FieldLabel>{translateText("Board Name")}</FieldLabel>
          <FieldInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={translateText("e.g. My Airdrops")}
            hasError={hasError}
            autoFocus
          />
          {hasError && <FieldError>{translateText("Enter your new board name")}</FieldError>}
        </FormField>

        <ModalFooter>
          <CancelButton type="button" onClick={handleClose}>
            {translateText("Cancel")}
          </CancelButton>
          <CreateButton type="button" onClick={handleSubmit}>
            {translateText("Create Board")}
          </CreateButton>
        </ModalFooter>
      </ModalWrapper>
    </Overlay>
  );
};
