import React, { FC, useEffect, useState } from "react";
import mockCompany from "../../../../../assets/images/nft/humans.png";
import { Eye, Star } from "lucide-react";
import {
  RecommendedItem,
  RecommendedItemBadge,
  RecommendedItemFavorite,
  RecommendedItemImage,
  RecommendedItemInfo,
  RecommendedItemPrice,
  RecommendedItems,
  RecommendedItemStats,
  RecommendedSection,
  RecommendedTitle,
} from "../styles";
import { mockRecommendedItems } from "../data";
import { getImageDominantColor } from "../utils";

const DynamicStar: FC<{ imageSrc: string }> = ({ imageSrc }) => {
  const [starColor, setStarColor] = useState("#ffffff");

  useEffect(() => {
    getImageDominantColor(imageSrc).then(setStarColor);
  }, [imageSrc]);

  return (
    <Star
      size={20}
      style={{
        color: starColor,
        filter: "brightness(1.2) contrast(1.2)",
      }}
    />
  );
};

interface Props {
  compact?: boolean;
}

const CartRecommendations: FC<Props> = ({ compact = false }) => {
  return (
    <RecommendedSection>
      <RecommendedTitle>We also recommend</RecommendedTitle>
      <div className={compact ? "" : "overflow"}>
        <RecommendedItems>
          {mockRecommendedItems.map((item) => (
            <RecommendedItem key={item.id}>
              <RecommendedItemImage>
                <img src={item.image.src} alt={item.name} />
                <RecommendedItemBadge>{item.badge}</RecommendedItemBadge>
                <RecommendedItemFavorite>
                  {compact ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <DynamicStar imageSrc={item.image.src} />
                  )}
                </RecommendedItemFavorite>
                <div className="item-number">{item.number}</div>
              </RecommendedItemImage>
              {compact ? (
                <>
                  <RecommendedItemInfo>
                    <div className="name">{item.name}</div>
                    <div className="category">{item.category}</div>
                    <RecommendedItemStats>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      {item.views}
                    </RecommendedItemStats>
                  </RecommendedItemInfo>
                  <RecommendedItemPrice>
                    <div className="price">ETH {item.price}</div>
                    <div className="usd-price">${item.usdPrice}</div>
                    <button className="add-to-cart">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </RecommendedItemPrice>
                </>
              ) : (
                <div className="recommended-item-info">
                  <RecommendedItemInfo>
                    <div className="item-header">
                      <img src={mockCompany.src} alt="company" />
                      <div>
                        <div className="name">{item.name}</div>
                        <div className="category">{item.category}</div>
                      </div>
                      <RecommendedItemStats>
                        <Eye width={16} height={16} color="#738094" />
                        {item.views}
                      </RecommendedItemStats>
                    </div>
                  </RecommendedItemInfo>
                  <RecommendedItemPrice>
                    <div>
                      <div className="price">ETH {item.price}</div>
                      <div className="usd-price">${item.usdPrice}</div>
                    </div>
                    <button className="add-to-cart">
                      <svg
                        width="18"
                        height="17"
                        viewBox="0 0 18 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 0.5C0.723858 0.5 0.5 0.723858 0.5 1C0.5 1.27614 0.723858 1.5 1 1.5V1V0.5ZM2.91045 1L3.39118 0.862517C3.3298 0.647927 3.13364 0.5 2.91045 0.5V1ZM6.01493 11.8552L5.5342 11.9927C5.60164 12.2285 5.83015 12.3806 6.0737 12.3518L6.01493 11.8552ZM15.5672 10.7245L15.6259 11.221C15.8376 11.196 16.0101 11.0394 16.0556 10.8312L15.5672 10.7245ZM17 4.16611L17.4885 4.27283C17.5208 4.12497 17.4844 3.97044 17.3895 3.85255C17.2945 3.73466 17.1513 3.66611 17 3.66611V4.16611ZM3.81592 4.16611L3.33519 4.30359V4.30359L3.81592 4.16611ZM1 1V1.5H2.91045V1V0.5H1V1ZM6.01493 11.8552L6.0737 12.3518L15.6259 11.221L15.5672 10.7245L15.5084 10.2279L5.95615 11.3587L6.01493 11.8552ZM15.5672 10.7245L16.0556 10.8312L17.4885 4.27283L17 4.16611L16.5115 4.05939L15.0787 10.6178L15.5672 10.7245ZM2.91045 1L2.42972 1.13748L3.33519 4.30359L3.81592 4.16611L4.29665 4.02863L3.39118 0.862517L2.91045 1ZM3.81592 4.16611L3.33519 4.30359L5.5342 11.9927L6.01493 11.8552L6.49565 11.7178L4.29665 4.02863L3.81592 4.16611ZM17 4.16611V3.66611H3.81592V4.16611V4.66611H17V4.16611ZM9 14.8162H8.5C8.5 15.1686 8.19022 15.5 7.75 15.5V16V16.5C8.6905 16.5 9.5 15.7715 9.5 14.8162H9ZM7.75 16V15.5C7.30979 15.5 7 15.1686 7 14.8162H6.5H6C6 15.7715 6.8095 16.5 7.75 16.5V16ZM6.5 14.8162H7C7 14.4639 7.30979 14.1325 7.75 14.1325V13.6325V13.1325C6.8095 13.1325 6 13.861 6 14.8162H6.5ZM7.75 13.6325V14.1325C8.19022 14.1325 8.5 14.4639 8.5 14.8162H9H9.5C9.5 13.861 8.6905 13.1325 7.75 13.1325V13.6325ZM15.6667 14.8162H15.1667C15.1667 15.1686 14.8569 15.5 14.4167 15.5V16V16.5C15.3572 16.5 16.1667 15.7715 16.1667 14.8162H15.6667ZM14.4167 16V15.5C13.9765 15.5 13.6667 15.1686 13.6667 14.8162H13.1667H12.6667C12.6667 15.7715 13.4762 16.5 14.4167 16.5V16ZM13.1667 14.8162H13.6667C13.6667 14.4639 13.9765 14.1325 14.4167 14.1325V13.6325V13.1325C13.4762 13.1325 12.6667 13.861 12.6667 14.8162H13.1667ZM14.4167 13.6325V14.1325C14.8569 14.1325 15.1667 14.4639 15.1667 14.8162H15.6667H16.1667C16.1667 13.861 15.3572 13.1325 14.4167 13.1325V13.6325Z"
                          fill="#04A584"
                        />
                      </svg>
                    </button>
                  </RecommendedItemPrice>
                </div>
              )}
            </RecommendedItem>
          ))}
        </RecommendedItems>
      </div>
    </RecommendedSection>
  );
};

export default CartRecommendations;
