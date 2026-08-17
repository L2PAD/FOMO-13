import React, { FC } from "react";
import { StarIcon } from "../../Icons";
import styled from "styled-components";
import { useTranslation } from "i18n";

const Btn = styled.button`
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const FavButton: FC<{
  isFavorite: boolean;
  onClick?: () => void;
  label?: string;
}> = ({ isFavorite, onClick, label }) => {
  const { translateText } = useTranslation();

  return (
    <Btn onClick={onClick && onClick} id="favorite">
      {isFavorite ? (
        <StarIcon fill="#FFC702" />
      ) : (
        <svg
          id="favorite"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="14"
          viewBox="0 0 16 14"
          fill="none"
        >
          <path
            id="favorite"
            d="M7.66339 0.810835C7.8011 0.531805 8.19899 0.531805 8.3367 0.810835L10.1194 4.42292C10.1741 4.53372 10.2798 4.61052 10.402 4.62829L14.3882 5.20751C14.6961 5.25226 14.8191 5.63067 14.5963 5.84787L11.7119 8.65948C11.6234 8.74573 11.583 8.87 11.6039 8.99178L12.2848 12.9618C12.3374 13.2685 12.0155 13.5024 11.7401 13.3576L8.17475 11.4832C8.06538 11.4257 7.93472 11.4257 7.82535 11.4832L4.26001 13.3576C3.98459 13.5024 3.66269 13.2685 3.71529 12.9618L4.39621 8.99178C4.4171 8.87 4.37672 8.74573 4.28824 8.65948L1.40382 5.84787C1.181 5.63067 1.30396 5.25226 1.61189 5.20751L5.59806 4.62829C5.72033 4.61052 5.82604 4.53372 5.88073 4.42292L7.66339 0.810835Z"
            stroke="#070B35"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{label ? translateText(label) : ""}</span>
    </Btn>
  );
};

export default FavButton;
