import React from "react";
import AboutHeader from "./AboutHeader";
import Join from "./Join";
import About from "./About";
import { AboutPageWrapper } from "./styles";

const AboutPage = () => {
  return (
    <AboutPageWrapper>
      <AboutHeader />
      <Join />
      <About />
    </AboutPageWrapper>
  );
};

export default AboutPage;
