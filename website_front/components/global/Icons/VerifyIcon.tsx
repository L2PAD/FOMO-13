import React, { useState } from "react";
import styled from "styled-components";
import DescriptionComponent from "../common/DescriptionComponent";

const Wrapper = styled.div`
  position: relative;
  & .verified-description {
    position: absolute;
    z-index: 10;
    top: 33px;
    left: -24px;
    height: 37px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    div {
      color: var(--main-gray);
      height: fit-content;
      font-size: 14px;
    }
  }
`;

const VerifyIcon = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  return (
    <Wrapper>
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
        >
          <path
            d="M11.8296 2.59332C12.177 2.3891 12.6176 2.53199 12.7927 2.90566L13.5898 4.60678C13.6936 4.82817 13.8983 4.9792 14.133 5.00749L15.9365 5.22485C16.3327 5.2726 16.6086 5.65828 16.5397 6.06792L16.2258 7.93278C16.1849 8.17548 16.2654 8.42316 16.4394 8.58993L17.776 9.87132C18.0696 10.1528 18.0754 10.6339 17.7887 10.9231L16.4837 12.2394C16.3139 12.4107 16.2394 12.6604 16.2861 12.9019L16.6452 14.7579C16.7241 15.1656 16.4576 15.5584 16.0628 15.6166L14.2651 15.8816C14.0311 15.9161 13.8301 16.0724 13.7318 16.2965L12.9762 18.0181C12.8103 18.3963 12.3733 18.5508 12.021 18.3558L10.4173 17.4682C10.2086 17.3527 9.95787 17.356 9.75203 17.477L8.17043 18.4067C7.82301 18.6109 7.38241 18.468 7.20731 18.0943L6.41019 16.3932C6.30645 16.1718 6.10171 16.0208 5.867 15.9925L4.06346 15.7751C3.66729 15.7274 3.39137 15.3417 3.46032 14.9321L3.77423 13.0672C3.81508 12.8245 3.73457 12.5768 3.56063 12.4101L2.22404 11.1287C1.93044 10.8472 1.9246 10.3661 2.21127 10.0769L3.5163 8.76063C3.68614 8.58932 3.76061 8.33959 3.71388 8.09805L3.35478 6.24208C3.2759 5.83439 3.54236 5.44155 3.93725 5.38335L5.73493 5.11842C5.96888 5.08394 6.16988 4.92755 6.26821 4.70349L7.02376 2.98186C7.18973 2.60368 7.62672 2.4492 7.97899 2.64418L9.58266 3.53179C9.79137 3.64731 10.0421 3.644 10.248 3.52301L11.8296 2.59332Z"
            fill="#2082EA"
          />
          <path
            d="M13 8.5L8.5253 12.5L7 11.1365"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <DescriptionComponent
        className="verified-description"
        isDate={false}
        isVisible={isVisible}
        text="Verified"
        date={new Date()}
      />
    </Wrapper>
  );
};

export default VerifyIcon;
