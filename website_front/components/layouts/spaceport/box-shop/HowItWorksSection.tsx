import React from "react";
import {
  HowItWorksWrapper,
  StepsGrid,
  StepCard,
  StepArrow,
} from "./styles";
import {
  ArrowRight,
  Crown,
  Gem,
  Info,
  Package,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useTranslation } from "i18n";

const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <HowItWorksWrapper>
      <div className="how-it-works-title">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.625 11.3333V17.1458M12.625 7.02505V6.97396M24.25 12.625C24.25 6.20469 19.0453 1 12.625 1C6.20469 1 1 6.20469 1 12.625C1 19.0453 6.20469 24.25 12.625 24.25C19.0453 24.25 24.25 19.0453 24.25 12.625Z" stroke="#05A584" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{t("spaceport.boxShop.howItWorksTitle")}</span>
      </div>

      <StepsGrid>
        <StepCard>
          <div className="icon-bubble mint">
            <svg width="23" height="26" viewBox="0 0 23 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.3923 25L21.7846 19V7L11.3923 1L1 7V19L11.3923 25ZM11.3923 25V13.75M11.3923 13.75L1.6423 7.75M11.3923 13.75L21.1423 7.75" stroke="#05A584" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div className="content">
            <h5>{t("spaceport.boxShop.stepFomoBoxTitle")}</h5>
            <p>{t("spaceport.boxShop.stepFomoBoxDescription")}</p>
          </div>
        </StepCard>

        <StepArrow>
          <ArrowRight />
        </StepArrow>

        <StepCard>
          <div className="icon-row">
            <div className="icon-bubble neutral">
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6817 1.36786C11.9125 0.877379 12.5796 0.877379 12.8105 1.36786L15.7994 7.71723C15.891 7.912 16.0683 8.047 16.2733 8.07823L22.9565 9.0964C23.4728 9.17505 23.6789 9.84023 23.3053 10.222L18.4693 15.1643C18.321 15.3159 18.2533 15.5344 18.2883 15.7484L19.4299 22.7271C19.5181 23.2662 18.9784 23.6773 18.5166 23.4227L12.539 20.1279C12.3556 20.0268 12.1366 20.0268 11.9532 20.1279L5.97555 23.4227C5.51378 23.6773 4.97408 23.2662 5.06227 22.7271L6.2039 15.7484C6.23892 15.5344 6.17123 15.3159 6.02288 15.1643L1.18686 10.222C0.813284 9.84023 1.01943 9.17505 1.5357 9.0964L8.21891 8.07823C8.42393 8.047 8.60115 7.912 8.69284 7.71723L11.6817 1.36786Z" stroke="#728094" stroke-width="2" stroke-linejoin="round" />
              </svg>
            </div>
            <div className="icon-bubble violet">
              <svg width="20" height="27" viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.0808 15.5167L10.17 1.23375C10.4385 0.811728 11.0918 1.00196 11.0918 1.50218V11.6852C11.0918 11.7404 11.1366 11.7852 11.1918 11.7852H17.6315C18.036 11.7852 18.2731 12.2405 18.0411 12.5719L9.00141 25.4857C8.72107 25.8862 8.0918 25.6878 8.0918 25.199V16.3852C8.0918 16.3299 8.04703 16.2852 7.9918 16.2852H1.50263C1.10809 16.2852 0.868981 15.8496 1.0808 15.5167Z" stroke="#8A53FF" stroke-width="2" />
              </svg>
            </div>
            <div className="icon-bubble rose">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.947 23.991C8.40609 23.991 7.80079 23.566 7.62049 23.0509L2.28867 8.13723C1.52882 5.99935 2.41746 5.34253 4.24625 6.65617L9.26897 10.2493C10.1061 10.8289 11.0591 10.5327 11.4197 9.59253L13.6864 3.55238C14.4076 1.62056 15.6053 1.62056 16.3265 3.55238L18.5932 9.59253C18.9538 10.5327 19.9069 10.8289 20.7311 10.2493L25.4447 6.88799C27.4538 5.44556 28.4197 6.17965 27.5955 8.51071L22.3925 23.0766C22.1993 23.566 21.594 23.991 21.0531 23.991H8.947Z" stroke="#FF5857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M7.91504 27.8809H22.0817" stroke="#FF5857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M11.7803 17.5723H18.2197" stroke="#FF5857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <div className="content">
            <h5>{t("spaceport.boxShop.stepRandomBoxTitle")}</h5>
            <p>{t("spaceport.boxShop.stepRandomBoxDescription")}</p>
          </div>
        </StepCard>

        <StepArrow>
          <ArrowRight />
        </StepArrow>

        <StepCard>
          <div className="icon-row">
            <div className="icon-bubble mint soft">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5294 1L18.8172 7.18276L25 9.47059L18.8172 11.7584L16.5294 17.9412L14.2416 11.7584L8.05882 9.47059L14.2416 7.18276L16.5294 1Z" stroke="#05A584" stroke-width="2" stroke-linejoin="round" />
                <path d="M5.94118 15.1176L7.93971 18.0603L10.8824 20.0588L7.93971 22.0574L5.94118 25L3.94264 22.0574L1 20.0588L3.94264 18.0603L5.94118 15.1176Z" stroke="#05A584" stroke-width="2" stroke-linejoin="round" />
              </svg>
            </div>
            <div className="icon-bubble mint soft">
              <svg width="26" height="27" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.21286 14.7241L2.79348 9.22581C3.17975 7.8821 4.06299 6.76614 5.2378 6.13742L7.15278 5.11258C8.65033 4.31113 10.4719 4.87889 11.3333 6.41559L13.1252 9.61208C13.5674 10.4009 13.7885 10.7954 14.0722 10.9984C14.4713 11.284 14.9723 11.3504 15.4239 11.1776C15.745 11.0547 16.0485 10.7298 16.6556 10.08C18.0854 8.54965 20.4658 8.80194 21.5874 10.6027L22.9928 12.859C23.7749 14.1148 24.0024 15.6748 23.615 17.1259L23.2044 18.6643C22.8343 20.0508 21.9375 21.2074 20.7325 21.8523L13.9971 25.4569C12.4048 26.3091 10.5027 26.1493 9.05405 25.0417L3.01302 20.4232C1.32959 19.1362 0.604464 16.8405 1.21286 14.7241Z" stroke="#05A584" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M17.7996 16H17.8104" stroke="#05A584" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M11.8 17.875L10 19.75" stroke="#05A584" stroke-width="2" stroke-linecap="round" />
                <path d="M9.3998 11.9412C8.26843 11.2064 7.70275 10.839 7.17554 11.0673C6.64833 11.2956 6.36549 12.0304 5.7998 13.5" stroke="#05A584" stroke-width="2" stroke-linecap="round" />
                <path d="M22.5468 1L20.4804 1C20.1552 1 19.9926 1 19.8413 1.02468C19.4802 1.08354 19.1489 1.24532 18.8949 1.48677C18.7885 1.58798 18.6983 1.71142 18.5179 1.95829C18.1299 2.48924 17.9359 2.75472 17.8618 3.00095C17.6826 3.59618 17.8991 4.23214 18.4164 4.63001C18.6303 4.79461 18.955 4.9131 19.6044 5.1501L20.822 5.59446C21.5981 5.87768 21.9861 6.01929 22.3741 5.99789C22.5383 5.98882 22.7003 5.95849 22.8551 5.90779C23.221 5.78802 23.5165 5.51841 24.1075 4.97917L24.2813 4.82059C24.4883 4.63179 24.5917 4.53739 24.6742 4.43261C24.83 4.23459 24.9336 4.00641 24.9769 3.76586C24.9998 3.63857 24.9998 3.50506 24.9998 3.23805C24.9998 2.6279 24.9998 2.32283 24.9088 2.07674C24.7357 1.60852 24.3329 1.24094 23.8197 1.08301C23.5499 1 23.2156 1 22.5468 1Z" stroke="#05A584" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <div className="content">
            <h5>{t("spaceport.boxShop.stepNftOrShardsTitle")}</h5>
            <p>{t("spaceport.boxShop.stepNftOrShardsDescription")}</p>
          </div>
        </StepCard>
      </StepsGrid>
    </HowItWorksWrapper>
  );
};

export default HowItWorksSection;
