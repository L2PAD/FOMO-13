import React, { FC, useId } from "react";
import { IconInterface } from "./IconIfterface";

const NftBadgeIcon: FC<IconInterface> = ({ className, fill = "#B5BCC7", isActive }) => {
  const gradientId = `nft-badge-gradient-${useId().replace(/:/g, "")}`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="19" x2="38" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15B8A4" />
          <stop offset="100%" stopColor="#12B983" />
        </linearGradient>
      </defs>
      <rect width="38" height="38" rx="8" fill={isActive ? `url(#${gradientId})` : fill} />
      <path d="M14.0391 26.3689C13.5958 26.3689 13.0997 26.0205 12.9519 25.5983L8.58188 13.375C7.9591 11.6227 8.68743 11.0844 10.1863 12.1611L14.303 15.1061C14.9891 15.5811 15.7702 15.3383 16.0658 14.5677L17.9235 9.61719C18.5147 8.03385 19.4963 8.03385 20.0874 9.61719L21.9452 14.5677C22.2408 15.3383 23.0219 15.5811 23.6974 15.1061L27.5608 12.3511C29.2074 11.1689 29.9991 11.7705 29.3235 13.6811L25.0591 25.6194C24.9008 26.0205 24.4047 26.3689 23.9613 26.3689H14.0391Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.1938 29.5586H24.805" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.3606 21.1094H21.6384" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default NftBadgeIcon;
