import React, { useState, FC } from "react";
import InputWithLabel from "../../../../../global/common/components_for_modals/input_with_label";
import { SubmitButton } from "../../../modals/CreateTopicModal/styles";
import Modal from "../../../../../global/common/Modal";
import updateProject from "../../../../../../http/projects/updateProject";
import { IProject } from "../../../../../../types/global_types";
import styled from "styled-components";
import useProjectPath from "../../../../../../hooks/useProjectPath";

interface IPrice {
  lowPrice: number;
  highPrice: number;
  price: number;
}

interface Props {
  onClose: () => void;
  project: IProject;
  updateProjectData: (values: any) => Promise<void>;
}

export const FlexRow = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
`;

const PriceRangeModal: FC<Props> = ({
  onClose,
  project,
  updateProjectData,
}) => {
  const location: string = useProjectPath() || "projects";

  const [priceRange, setPriceRange] = useState<IPrice>({
    lowPrice: project.lowPrice || 0,
    highPrice: project.highPrice || 0,
    price: project.price || 0,
  });

  const inputHandler = (value: number, name?: string): void => {
    name && setPriceRange({ ...priceRange, [name]: value });
  };

  const confirmEditProject = async (): Promise<void> => {
    const editedProject = {
      lowPrice: priceRange.lowPrice,
      highPrice: priceRange.highPrice,
      price: priceRange.price,
    };
    updateProjectData(editedProject);
  };

  return (
    <Modal title="Price range" onClose={onClose} variant="small">
      <FlexRow>
        <InputWithLabel
          label="Low ($)"
          type="number"
          name="lowPrice"
          value={priceRange.lowPrice || 0}
          onChange={inputHandler}
        />
        <InputWithLabel
          label="Current ($)"
          type="number"
          name="price"
          value={priceRange.price || 0}
          onChange={inputHandler}
        />
        <InputWithLabel
          label="High ($)"
          name="highPrice"
          value={priceRange.highPrice || 0}
          onChange={inputHandler}
        />
      </FlexRow>
      <SubmitButton onClick={confirmEditProject}>Save changes</SubmitButton>
    </Modal>
  );
};

export default PriceRangeModal;
