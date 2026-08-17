import React from "react";
import {
  clarifyAmount,
  getCirculatingSupplyProgress,
  getProjectSymbol,
  imageLoader,
  PriceChangeCell,
  ProgressBar,
  ProjectData,
  simplifyAmount,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

const GainersRowContent = ({ item }: UniversalTableCaseProps) => {
  const symbol = getProjectSymbol(item);

  return (
    <>
      <ProjectData>
        <UserAvatar
          size="small"
          variant="default"
          avatar={imageLoader(String(item.logo))}
          name={item.name}
          fallbackType="project"
        />
        <div className="project-row-data">
          <p>
            {(item?.name?.length || 0) > 20
              ? `${item?.name?.slice(0, 15)}...`
              : item?.name}
          </p>
          <span>{symbol}</span>
        </div>
      </ProjectData>
      <div>${simplifyAmount(Number(item.price || 0), 2)}</div>
      <PriceChangeCell value={item.usdQuote?.percent_change_1h} />
      <PriceChangeCell value={item.usdQuote?.percent_change_24h} />
      <PriceChangeCell value={item.usdQuote?.percent_change_7d} />
      <div>${clarifyAmount(item.marketCap || 0)}</div>
      <div>
        <p>${clarifyAmount(item.volume24h || 0)}</p>
      </div>
      <div>
        <p>
          {simplifyAmount(item.circulatingSupply || 0, 0)} {symbol}
        </p>
        <ProgressBar progress={getCirculatingSupplyProgress(item)}>
          <div />
        </ProgressBar>
      </div>
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="48" viewBox="0 0 150 48" fill="none">
          <path d="M3.53616 9.06454L1.22684 11.2862C0.442965 12.0403 0 13.0811 0 14.1688V44C0 46.2091 1.79086 48 4 48H146C148.209 48 150 46.2091 150 44V32.8532C150 30.6585 148.169 28.9669 146.121 28.1764C143.598 27.202 141.851 25.3654 140.679 23.5196C139.502 21.6651 137.136 20.6145 135.175 21.6038C133.841 22.2768 132.228 22.0399 131.143 21.0118L128.332 18.3464C127.485 17.5427 126.197 17.4248 125.217 18.0612C124.171 18.7411 122.785 18.5553 121.955 17.6238L119.79 15.1949C118.119 13.321 115.156 13.4308 113.629 15.4232L111.467 18.2435C110.538 19.4554 109.001 20.0328 107.504 19.7317L106.448 19.5194C105.559 19.3406 104.636 19.4691 103.83 19.8837L102.418 20.61C100.877 21.4026 99.0004 21.1127 97.7704 19.8919L97.2626 19.3878C96.0948 18.2287 94.3365 17.9029 92.831 18.5667L90.3792 19.6477C89.5665 20.006 88.6267 19.9206 87.8919 19.4217C86.2714 18.3212 83.867 19.4015 82.6789 20.9589C81.9659 21.8934 81.1194 22.6321 80.348 23.1656C79.5002 23.752 78.3912 23.8016 77.515 23.2586C73.2093 20.5905 71.2529 13.8931 70.5772 9.11286C70.3922 7.80385 69.0287 6.9461 67.806 7.44889C67.0491 7.76011 66.1782 7.5561 65.6383 6.94114L62.3997 3.25217C61.4765 2.20063 59.9667 1.89109 58.7043 2.4945L58.6306 2.5297C57.4301 3.10348 55.9954 2.82239 55.1002 1.83801C53.5439 0.126686 50.6815 0.765057 49.3264 2.63973C45.835 7.46971 40.6307 7.792 37.1093 6.97943C35.9499 6.7119 34.7099 6.76486 33.6781 7.35748L32.9778 7.7597C32.0529 8.29092 30.8997 8.21619 30.0511 7.57006C28.8043 6.62068 27.0104 6.95414 26.188 8.28818L24.0016 11.8348C22.7446 13.8738 19.9562 14.2933 18.155 12.7143L18.0221 12.5978C17.0996 11.7891 15.8252 11.5136 14.651 11.869C13.4307 12.2384 12.1061 11.9256 11.18 11.0492L9.05867 9.04181C7.50708 7.57355 5.07561 7.58355 3.53616 9.06454Z" fill="url(#paint0_linear_2638_3619)" />
          <defs>
            <linearGradient id="paint0_linear_2638_3619" x1="75.3314" y1="-2" x2="75.3314" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5858" />
              <stop offset="0.932292" stopColor="#FF5858" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
};

export default GainersRowContent;
