/* eslint-disable */
import React, { FC } from "react";
import { IStepProps } from "..";
import { calculatePageFullness, calculateRating } from "..";
import InputWithLabel from "../../../common/components_for_modals/input_with_label";
import { ModalRow } from "../../creating_project/styles";
import OfficialLinks from "../../../common/OfficialLinks";
import { ISocialMediaItem } from "../../../../../types/global_types";
import Checkbox from "../../../common/Checkbox";
import { InputError } from "../../../../layouts/projects/modals/CreateOwnAsset/styles";

const ThirdStep: FC<IStepProps> = ({
  setIsChecked,
  inputsHandler,
  data,
  isChecked,
  validationErrors,
}) => {
  return (
    <div>
      <ModalRow>
        <p>Project Description</p>
        <textarea
          value={data.descriptionText}
          onChange={(e: any) =>
            inputsHandler(e.target.value, "descriptionText")
          }
          placeholder="Enter project description"
        />
        <div className="text-label">300 Characters Max</div>
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          placeholder="Banner text"
          label="Text for IDO banner"
          value={data.banner}
          onChange={(value) => inputsHandler(value, "banner")}
        />
      </ModalRow>
      <ModalRow>
        <p>Official links</p>
        <OfficialLinks
          socialLinks={data.socialmedia || []}
          onChange={(items: Array<ISocialMediaItem>) => {
            inputsHandler(items, "socialmedia");
          }}
        />
      </ModalRow>
      <ModalRow>
        <Checkbox
          label="I confirm that the entered data is accurate"
          checked={!!isChecked}
          onChange={() => setIsChecked && setIsChecked(!isChecked)}
        />
        {validationErrors?.includes("checkbox") ? (
          <InputError>
            <br />
            This box must be checked.
          </InputError>
        ) : (
          <></>
        )}
      </ModalRow>
    </div>
  );
};

export default ThirdStep;
