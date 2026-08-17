/* eslint-disable */
import React, { FC } from "react";
import { ModalRow } from "../styles";
import { IStepProps } from "..";
import { calculatePageFullness, calculateRating } from "..";
import InputWithLabel from "../../../common/components_for_modals/input_with_label";
import SearchCountry from "../../../SearchCountry";
import { ICountry } from "../../../GlobalMap";
import OfficialLinks from "../../../common/OfficialLinks";
import { IProject, ISocialMediaItem } from "../../../../../types/global_types";
import Checkbox from "../../../common/Checkbox";
import SearchProject from "../../../SearchProject";
import { InputError } from "../../../../layouts/projects/modals/CreateOwnAsset/styles";
import ProjectsSearch from "../../../common/ProjectsSearch";

const ThirdStep: FC<IStepProps> = ({
  data,
  inputsHandler,
  isChecked,
  setIsChecked,
  validationErrors,
}) => {
  return (
    <div>
      <ModalRow>
        <p>Short Bio</p>
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
        <p>Related Projects, Funds or Companies</p>
        <ProjectsSearch
          projects={data.participated || []}
          onChange={(participated: Array<IProject>) =>
            inputsHandler(participated, "participated")
          }
        />
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
        <p>Location</p>
        <SearchCountry
          className="modal-search"
          selectedCountry={data.regionData || null}
          onChange={(value: ICountry) => inputsHandler(value, "regionData")}
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
