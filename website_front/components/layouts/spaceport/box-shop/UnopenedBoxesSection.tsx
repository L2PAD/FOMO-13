import React from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import {
  UnopenedBoxesWrapper,
  UnopenedBoxesHeader,
  UnopenedBoxesGrid,
  UnopenedBoxCard,
  UnopenedBoxImage,
  UnopenedBoxTitle,
  OpenBoxButton,
} from "./styles";
import { useTranslation } from "i18n";

export interface UnopenedBox {
  id: string;
  tokenId: number;
  type: "uncommon" | "epic" | "legendary";
  name: string;
  image: string;
}

interface UnopenedBoxesSectionProps {
  boxes: UnopenedBox[];
  onOpenBox: (boxId: string) => void | Promise<void>;
  openingBoxId?: string;
  disabled?: boolean;
}

const UnopenedBoxesSection: React.FC<UnopenedBoxesSectionProps> = ({
  boxes,
  onOpenBox,
  openingBoxId = "",
  disabled = false,
}) => {
  const { t } = useTranslation();

  if (boxes.length === 0) return null;

  return (
    <UnopenedBoxesWrapper>
      <UnopenedBoxesHeader>
        {t("spaceport.boxShop.yourUnopenedBoxesWithCount", {
          values: { count: boxes.length },
        })}
      </UnopenedBoxesHeader>
      <UnopenedBoxesGrid>
        {boxes.map((box) => (
          <UnopenedBoxCard key={box.id}>
            <UnopenedBoxImage>
              <Image
                src={box.image}
                alt={box.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </UnopenedBoxImage>
            <div className="info-section">
              <UnopenedBoxTitle>{box.name}</UnopenedBoxTitle>
              <OpenBoxButton
                onClick={() => onOpenBox(box.id)}
                disabled={disabled || !!openingBoxId}
              >
                <Gift size={16} />
                {openingBoxId === box.id
                  ? t("spaceport.boxShop.opening")
                  : t("spaceport.boxShop.openBox")}
              </OpenBoxButton>
            </div>
          </UnopenedBoxCard>
        ))}
      </UnopenedBoxesGrid>
    </UnopenedBoxesWrapper>
  );
};

export default UnopenedBoxesSection;
