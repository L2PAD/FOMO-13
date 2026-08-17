import React from "react";
import { AlertCircle } from "lucide-react";
import { InfoSection } from "./styles";
import { useTranslation } from "i18n";

interface ImportantInfoSectionProps {
  maxPerWallet?: number;
  maxSupply?: number;
  totalMinted?: number;
  salePaused?: boolean;
  isLoading?: boolean;
}

const ImportantInfoSection: React.FC<ImportantInfoSectionProps> = ({
  maxPerWallet = 6,
  maxSupply = 666,
  totalMinted = 0,
  salePaused = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const remaining = Math.max(maxSupply - totalMinted, 0);

  return (
    <InfoSection variant="warning">
      <AlertCircle size={40} color="#FFC704" />
      <div className="content">
        <h4
          style={{
            color: "#FFC704",
          }}
        >
          {t("spaceport.boxShop.importantTitle")}
        </h4>
        <ul>
          <li>
            {t("spaceport.boxShop.importantFcfs", {
              values: {
                left: isLoading ? "--" : remaining,
                max: isLoading ? "--" : maxSupply,
              },
            })}
          </li>
          <li>
            {t("spaceport.boxShop.importantMaxPerWallet", {
              values: { max: isLoading ? "--" : maxPerWallet },
            })}
          </li>
          <li>{t("spaceport.boxShop.importantDiscount")}</li>
          <li>{t("spaceport.boxShop.importantUncommonChance")}</li>
          <li>{t("spaceport.boxShop.importantCollectShards")}</li>
          <li>{t("spaceport.boxShop.importantOpenAfterPurchase")}</li>
          {salePaused && <li>{t("spaceport.boxShop.importantSalePaused")}</li>}
        </ul>
      </div>
    </InfoSection>
  );
};

export default ImportantInfoSection;

