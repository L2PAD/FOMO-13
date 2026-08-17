/* eslint-disable */
import React, { FC, useState } from "react";
import { ArrowDownIcon } from "../Icons";
import { IProject, INft } from "../../../types/global_types";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../helpers/imageFallbacks";
import {
  DropdownWrapper,
  InputValue,
  Label,
  Wrapper,
  Item,
  InputProjectWrapper,
} from "./styles";

interface Props {
  name?: string;
  label: string;
  items: Array<IProject | INft | any>;
  onChange: (value: IProject | INft) => void;
  project: IProject | INft | undefined;
}

const ModalSelectProject: FC<Props> = ({ label, items, onChange, project }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!project) return <></>;

  return (
    <Wrapper>
      <Label>{label}</Label>
      <InputValue active={isOpen} onClick={() => setIsOpen((state) => !state)}>
        <InputProjectWrapper>
          <img
            src={getProjectImage(project?.logo, project?.name)}
            alt={project.name}
            onError={setProjectImageFallback}
          />
          {project.name}
        </InputProjectWrapper>
        <ArrowDownIcon />
      </InputValue>
      <DropdownWrapper active={isOpen}>
        {items.map((item, i) => (
          <Item
            key={i}
            onClick={() => {
              onChange(item);
              setIsOpen(false);
            }}
          >
            <img
              src={getProjectImage(item.logo, item.name || item.symbol)}
              alt={item.name}
              onError={setProjectImageFallback}
            />
            <span>{item.name}</span>
          </Item>
        ))}
      </DropdownWrapper>
    </Wrapper>
  );
};

export default ModalSelectProject;
