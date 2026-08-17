import React from "react";
import { ProjectsProjectsCards } from "../../../../../../staticContent/projects/projects";
import {
  TableWrapper,
  Wrapper,
  PageDescription,
  PageDescriptionWrapper,
  ProjectCardItem,
  ProjectCardLink,
} from "./styles";

const EndedComparison = () => {
  return (
    <Wrapper>
      <PageDescriptionWrapper>
        <PageDescription variant="p">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
          sint. Velit officia consequat duis enim velit mollit. Exercitation
          veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
          ullamco est sit aliqua dolor do amet sint. Velit officia consequat
          duis enim velit mollit.
        </PageDescription>
      </PageDescriptionWrapper>
      <TableWrapper>
        {ProjectsProjectsCards.map((item, i) => {
          if (i < 2) {
            return (
              <ProjectCardLink href="/crypto/project/123" key={i}>
                <ProjectCardItem
                  type="default"
                  //@ts-ignore
                  cardData={item}
                />
              </ProjectCardLink>
            );
          }
          return null;
        })}
      </TableWrapper>
    </Wrapper>
  );
};

export default EndedComparison;
