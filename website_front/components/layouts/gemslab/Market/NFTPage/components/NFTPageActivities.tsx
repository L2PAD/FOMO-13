import React from "react";
import Pagination from "../../../../../global/Pagintaion";
import {
  ActivitiesTable,
  ActivitiesTitle,
  ActivitiesWrapper,
  ActivityType,
  ActivityTypeLabel,
  ActivityTypeStatus,
  AddressLink,
  DateCell,
  ItemCollectionName,
  ItemDetails,
  ItemImage,
  ItemInfo,
  ItemName,
  PriceAmount,
  PriceInfo,
  PriceUSDAmount,
  TableCell,
  TableHeader,
  TableRow,
} from "../styles";
import { NFTPageActivity } from "../types";
import { useTranslation } from "i18n";

interface NFTPageActivitiesProps {
  activities: NFTPageActivity[];
}

export const NFTPageActivities: React.FC<NFTPageActivitiesProps> = ({
  activities,
}) => {
  const { t } = useTranslation();

  return (
  <ActivitiesWrapper>
    <ActivitiesTitle>{t("nftMarket.activity.title")}</ActivitiesTitle>
    <ActivitiesTable>
      <TableHeader>
        <TableCell className="sticky">{t("nftMarket.activity.type")}</TableCell>
        <TableCell>{t("nftMarket.activity.items")}</TableCell>
        <TableCell>{t("nftMarket.activity.price")}</TableCell>
        <TableCell>{t("nftMarket.activity.from")}</TableCell>
        <TableCell>{t("nftMarket.activity.to")}</TableCell>
        <TableCell>{t("nftMarket.activity.date")}</TableCell>
      </TableHeader>
      {activities.map((activity) => (
        <TableRow key={activity.id}>
          <ActivityType className="sticky">
            <ActivityTypeLabel>{activity.type}</ActivityTypeLabel>
            <ActivityTypeStatus>
              {t(`nftMarket.activity.status.${String(activity.status).toLowerCase()}`, {
                defaultValue: activity.status,
              })}
            </ActivityTypeStatus>
          </ActivityType>
          <ItemInfo>
            <ItemImage>
              <img src={activity.itemImage} alt={activity.itemName} />
            </ItemImage>
            <ItemDetails>
              <ItemCollectionName>{activity.collectionName}</ItemCollectionName>
              <ItemName>{activity.itemName}</ItemName>
            </ItemDetails>
          </ItemInfo>
          <PriceInfo>
            <PriceAmount>{`${activity.currency} ${activity.price}`}</PriceAmount>
            <PriceUSDAmount>${activity.priceUSD.toFixed(2)}</PriceUSDAmount>
          </PriceInfo>
          <AddressLink>{activity.from}</AddressLink>
          <AddressLink>{activity.to}</AddressLink>
          <DateCell>{activity.date}</DateCell>
        </TableRow>
      ))}
    </ActivitiesTable>
    <Pagination
      style={{ marginTop: "20px" }}
      page={1}
      totalPage={1}
      onChange={() => {}}
    />
  </ActivitiesWrapper>
  );
};
