import React from "react";
import { ContentWrapper, PageDescriptionWrapper, PageWrapper } from "./styles";
import Market from "../../projects/News/Market";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";

const News = () => {
  return (
    <PageWrapper>
      <PageDescriptionWrapper>
        <Typography variant="h1">Blog</Typography>
        <br />
        <Subtitle>
          Find here the latest news, upgrades and announcements related to the
          market and Fomoland. Stay informed.
        </Subtitle>
      </PageDescriptionWrapper>
      <ContentWrapper>
        <Market />
      </ContentWrapper>
    </PageWrapper>
  );
};

export default News;
