import React from "react";
import { InfoSection } from "./styles";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import { useTranslation } from "i18n";

const BenefitsSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <InfoSection variant="info">
      <div className="icon-wrapper">
        <SparklesIcon />
      </div>
      <div className="content">
        <h4>{t("spaceport.boxShop.benefitsTitle")}</h4>
        <ul>
          <li>{t("spaceport.boxShop.benefitsBetaAccess")}</li>
          <li>{t("spaceport.boxShop.benefitsTestFeatures")}</li>
          <li>{t("spaceport.boxShop.benefitsGamification")}</li>
          <li>{t("spaceport.boxShop.benefitsRewards")}</li>
        </ul>
      </div>
    </InfoSection>
  );
};

export default BenefitsSection;
