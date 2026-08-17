import React, { FC, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Modal from "../../../../../global/common/Modal";
import {
  AddButton,
  DeleteButton,
  FlagField,
  FlagForm,
  FlagHint,
  FlagRow,
  ModalRow,
} from "./styles";
import { CloseIcon } from "../../../../../global/Icons";
import { SubmitButton } from "../../../modals/AddFundsModal/styles";
import { IFlag } from "../../../../../../types/global_types";
import {
  createFomoV2Flag,
  FomoV2FlagEntityType,
} from "../../../../../../http/fomoV2Flags";
import getAuthToken from "../../../../../../http/getAuthToken";

interface Props {
  project: any;
  onClose: () => void;
  updateProjectData: (values: any) => any;
  v2EntityType?: FomoV2FlagEntityType;
  v2EntityId?: string;
  onSubmitted?: () => void;
  onAuthRequired?: () => void;
}

const RedFlagsModal: FC<Props> = ({
  onClose,
  project,
  updateProjectData,
  v2EntityType,
  v2EntityId,
  onSubmitted,
  onAuthRequired,
}) => {
  const [flags, setFlags] = useState<Array<IFlag>>(project.redFlagsList || []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isV2Flag = Boolean(v2EntityType && v2EntityId);

  const addFlag = (): void => {
    setFlags((prev) => [...prev, { text: "", link: "", type: true }]);
  };

  const removeFlag = (flag: IFlag, index: number): void => {
    setFlags((prev) =>
      prev.filter((fl: IFlag, i) => {
        return index !== i;
      })
    );
  };

  const confirmChanges = async (): Promise<void> => {
    if (isV2Flag && v2EntityType && v2EntityId) {
      if (!getAuthToken()) {
        onClose();
        onAuthRequired?.();
        return;
      }

      if (!description.trim()) {
        toast.error("Add a short flag description");
        return;
      }

      setIsSubmitting(true);
      const result = await createFomoV2Flag({
        entityType: v2EntityType,
        entityId: v2EntityId,
        flagType: "red",
        title,
        description,
        sourceUrl,
      });
      setIsSubmitting(false);

      if (result.isSuccess) {
        toast.success("Red flag sent to moderation");
        onSubmitted?.();
        onClose();
      } else {
        if (
          result.status === 401 ||
          result.status === 403 ||
          /auth|unauthor/i.test(result.error || "")
        ) {
          onClose();
          onAuthRequired?.();
          return;
        }

        toast.error(result.error || "Red flag was not submitted");
      }
      return;
    }

    updateProjectData({
      redFlagsList: flags.filter((item: IFlag) => item.text.length > 0),
    });
  };

  const inputsHanlder = useCallback(
    (text: string, index: number) => {
      setFlags((prev) => {
        return prev.map((flag: IFlag, i: number) => {
          if (i === index) {
            return { ...flag, text };
          }

          return flag;
        });
      });
    },
    [flags]
  );

  return (
    <Modal title="Red flags" onClose={onClose} variant="medium">
      {isV2Flag ? (
        <FlagForm>
          <FlagHint>
            The flag will be visible after admin confirmation.
          </FlagHint>
          <FlagField>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short summary"
            />
          </FlagField>
          <FlagField>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What makes this a red flag?"
            />
          </FlagField>
          <FlagField>
            <span>Source URL</span>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
            />
          </FlagField>
        </FlagForm>
      ) : (
        <ModalRow>
          <AddButton onClick={addFlag}>+ Add flag</AddButton>
          {flags.length ? (
            flags.map((flag: IFlag, index) => {
              return (
                <FlagRow key={index}>
                  <span>#{index + 1}</span>
                  <input
                    value={flag.text}
                    onChange={(e) => inputsHanlder(e.target.value, index)}
                    type="text"
                  />
                  <DeleteButton onClick={() => removeFlag(flag, index)}>
                    <CloseIcon fill="#FF5858" />
                  </DeleteButton>
                </FlagRow>
              );
            })
          ) : (
            <></>
          )}
        </ModalRow>
      )}
      <SubmitButton onClick={confirmChanges} disabled={isSubmitting}>
        {isV2Flag ? "Send to moderation" : "Save changes"}
      </SubmitButton>
    </Modal>
  );
};

export default RedFlagsModal;
