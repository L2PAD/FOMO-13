import React, { FC, useContext } from "react";
import {
  AboutPageLinks,
  Categories,
  LinksWrapper,
  SearchWrapper,
  Wrapper,
} from "./styles";
import { CardKey } from "../ProjectPriceStatistics/styles";
import Image from "next/image";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import imageLoader from "../../../../../../helpers/imageLoader";
import {
  IPerson,
  IProject,
  ISocialMediaItem,
} from "../../../../../../types/global_types";
import TextEditor from "../../../../../global/common/text_editor/TextEditor";
import OfficialLinks from "../../../../../global/common/OfficialLinks";
import { getServiceByUrl } from "../../../../../../helpers/getServiceByUrl";
import CategoriesEdit from "../../../../../global/common/CategoriesEdit";
import { useTranslation } from "i18n";

interface IProps {
  isCategories?: boolean;
  project: IProject | IPerson;
  inputsHandler: (name: string, value: any) => void;
}

const AboutProjectEdit: FC<IProps> = ({
  isCategories = true,
  project,
  inputsHandler,
}) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper variant="main">
      <TextEditor
        name="descriptionText"
        value={project.descriptionText || ""}
        handler={(name: string, text: string) => inputsHandler(name, text)}
      />
      <br />
      <AboutPageLinks>
        <CardKey style={{ fontSize: "16px", marginBottom: "15px" }}>
          {translateText("Official links")}
        </CardKey>
        <OfficialLinks
          websiteLogo={String(project.logo)}
          socialLinks={project?.socialmedia || []}
          onChange={(items: Array<ISocialMediaItem>) =>
            inputsHandler("socialmedia", items)
          }
        />
        <br />
        {isCategories ? (
          <>
            <CardKey style={{ fontSize: "16px" }}>{translateText("Categories")}</CardKey>
            <br />
            <CategoriesEdit
              categories={project?.categories || []}
              onChange={(items: Array<string>) =>
                inputsHandler("categories", items)
              }
            />
          </>
        ) : (
          <></>
        )}
      </AboutPageLinks>
    </Wrapper>
  );
};

export default AboutProjectEdit;
