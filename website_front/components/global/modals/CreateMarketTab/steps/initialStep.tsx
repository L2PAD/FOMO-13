import React, { useContext } from "react";
import {
  ButtonsWrapper,
  Header,
  Step,
  StepDescription,
  StepHeader,
  Steps,
  Wrapper,
} from "./styles";
import { RejectButton } from "../../../../layouts/projects/OTC/DealItem/styles";
import { TabHubModalContext } from "../../../../layouts/projects/CryptoMarket/tabHub";

const InitialStep = () => {
  const {
    setIsCreateTab,
    setIsMainModal,
    setIsCreateOwnAsset,
    setIsTabSettings,
    setSettingsSection,
  } = useContext(TabHubModalContext);

  return (
    <Wrapper>
      <Header>
        Design a personalized tab to track, analyze, and compare crypto assets.
        Filter data, customize the layout, build your ultimate research hub and
        share your unique setups!
      </Header>
      <Steps>
        <Step
          onClick={() => {
            setIsTabSettings(true);
            setSettingsSection("Assets");
          }}
        >
          <StepHeader>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="21"
              viewBox="0 0 22 21"
              fill="none"
            >
              <path
                d="M13.4619 15.2984V10.4984L20.1081 3.85229C20.4773 3.48306 20.6004 3.11382 20.6004 2.62151C20.6004 1.6369 19.8619 0.898438 18.8773 0.898438H3.12348C2.13887 0.898438 1.40039 1.6369 1.40039 2.62151C1.40039 3.11382 1.52348 3.48306 1.89271 3.85229L8.53886 10.4984V20.0984L13.4619 15.2984Z"
                stroke="#738094"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Step 1: Filters</span>
          </StepHeader>
          <StepDescription>
            Refine your asset selection with a wide range of advanced filters.
            Focus on key metrics like volume, price action, or market trends.
            Choose exactly what matters and remove the noise.
          </StepDescription>
        </Step>
        <Step
          onClick={() => {
            setIsTabSettings(true);
            setSettingsSection("Customize Tab");
          }}
        >
          <StepHeader>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="19"
              viewBox="0 0 20 19"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.6763 1.81627C11.2488 0.0612432 8.75121 0.0612432 8.3237 1.81627C8.25987 2.07999 8.13468 2.32492 7.95831 2.53112C7.78194 2.73732 7.55938 2.89897 7.30874 3.00291C7.0581 3.10684 6.78646 3.15014 6.51592 3.12927C6.24538 3.10839 5.9836 3.02394 5.75187 2.88279C4.20832 1.94227 2.44201 3.70855 3.38254 5.25207C3.99006 6.24884 3.45117 7.54936 2.31713 7.82499C0.560955 8.25137 0.560955 10.75 2.31713 11.1753C2.58093 11.2392 2.8259 11.3645 3.03211 11.541C3.23831 11.7175 3.39991 11.9402 3.50375 12.191C3.6076 12.4418 3.65074 12.7135 3.62968 12.9841C3.60862 13.2547 3.52394 13.5165 3.38254 13.7482C2.44201 15.2917 4.20832 17.058 5.75187 16.1175C5.98356 15.9761 6.24536 15.8914 6.51597 15.8704C6.78658 15.8493 7.05834 15.8924 7.30912 15.9963C7.5599 16.1001 7.7826 16.2617 7.95911 16.4679C8.13561 16.6741 8.26091 16.9191 8.32482 17.1829C8.75121 18.939 11.2499 18.939 11.6752 17.1829C11.7393 16.9192 11.8647 16.6744 12.0413 16.4684C12.2178 16.2623 12.4405 16.1008 12.6912 15.997C12.9419 15.8932 13.2135 15.85 13.4841 15.8709C13.7546 15.8919 14.0164 15.9764 14.2481 16.1175C15.7917 17.058 17.558 15.2917 16.6175 13.7482C16.4763 13.5165 16.3918 13.2547 16.3709 12.9842C16.35 12.7136 16.3932 12.442 16.497 12.1913C16.6008 11.9406 16.7623 11.7179 16.9683 11.5414C17.1744 11.3648 17.4192 11.2394 17.6829 11.1753C19.439 10.7489 19.439 8.25025 17.6829 7.82499C17.4191 7.76108 17.1741 7.63578 16.9679 7.45928C16.7617 7.28278 16.6001 7.06007 16.4962 6.8093C16.3924 6.55853 16.3493 6.28677 16.3703 6.01617C16.3914 5.74556 16.4761 5.48376 16.6175 5.25207C17.558 3.70855 15.7917 1.94227 14.2481 2.88279C14.0164 3.02418 13.7546 3.10886 13.484 3.12992C13.2134 3.15098 12.9417 3.10784 12.6909 3.004C12.4401 2.90016 12.2174 2.73856 12.0409 2.53236C11.8644 2.32616 11.7391 2.08119 11.6752 1.8174L11.6763 1.81627Z"
                stroke="#738094"
              />
              <path
                d="M12 9.5C12 10.6046 11.1046 11.5 10 11.5C8.89543 11.5 8 10.6046 8 9.5C8 8.39543 8.89543 7.5 10 7.5C11.1046 7.5 12 8.39543 12 9.5Z"
                stroke="#738094"
              />
            </svg>
            <span>Step 2: Columns & Data View</span>
          </StepHeader>
          <StepDescription>
            Customize your tab layout by adding, removing, or rearranging any
            metric. Track performance the way you need so it works best for your
            research.
          </StepDescription>
        </Step>
        <Step
          onClick={() => {
            setIsTabSettings(true);
            setSettingsSection("Assets");
          }}
        >
          <StepHeader>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
            >
              <path
                d="M1.9502 5.07325C1.9502 5.76815 2.50226 6.43459 3.48495 6.92596C4.46764 7.41733 5.80045 7.69338 7.19017 7.69338C8.5799 7.69338 9.91271 7.41733 10.8954 6.92596C11.8781 6.43459 12.4302 5.76815 12.4302 5.07325C12.4302 4.37835 11.8781 3.71191 10.8954 3.22054C9.91271 2.72917 8.5799 2.45313 7.19017 2.45312C5.80045 2.45313 4.46764 2.72917 3.48495 3.22054C2.50226 3.71191 1.9502 4.37835 1.9502 5.07325Z"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.4307 8.56382V5.07031"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.9502 5.07031V18.171C1.9502 19.6208 4.29945 20.7911 7.19017 20.7911C7.68407 20.7928 8.17741 20.7578 8.6661 20.6863"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.9502 14.8984C1.9502 16.3482 4.29945 17.5186 7.19017 17.5186C7.69587 17.5172 8.20081 17.4793 8.70103 17.405"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.9502 11.625C1.9502 13.0748 4.29945 14.2451 7.19017 14.2451C7.68407 14.2469 8.17741 14.2119 8.6661 14.1403"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.9502 8.35156C1.9502 9.80137 4.29945 10.9717 7.19017 10.9717C7.69587 10.9703 8.20081 10.9324 8.70103 10.8582"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.1201 13.1514C11.1201 13.8463 11.6722 14.5127 12.6549 15.0041C13.6376 15.4955 14.9704 15.7715 16.3601 15.7715C17.7498 15.7715 19.0826 15.4955 20.0653 15.0041C21.048 14.5127 21.6001 13.8463 21.6001 13.1514C21.6001 12.4565 21.048 11.79 20.0653 11.2987C19.0826 10.8073 17.7498 10.5312 16.3601 10.5312C14.9704 10.5312 13.6376 10.8073 12.6549 11.2987C11.6722 11.79 11.1201 12.4565 11.1201 13.1514Z"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.1201 13.1484V19.4804C11.1201 20.9302 13.4694 22.1005 16.3601 22.1005C19.2508 22.1005 21.6001 20.9302 21.6001 19.4804V13.1484"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21.6001 16.2109C21.6001 17.6607 19.2508 18.8311 16.3601 18.8311C13.4694 18.8311 11.1201 17.6607 11.1201 16.2109"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Step 3: Assets & Watchlists</span>
          </StepHeader>
          <StepDescription>
            Manually select specific assets to follow or build curated
            watchlists and save them for quick access.
          </StepDescription>
        </Step>
      </Steps>
      <ButtonsWrapper>
        <RejectButton
          onClick={() => {
            setIsMainModal(true);
            setIsCreateTab(false);
          }}
          className="main-reject"
        >
          Cancel
        </RejectButton>
      </ButtonsWrapper>
    </Wrapper>
  );
};

export default InitialStep;
