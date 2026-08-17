import React, { FC } from "react";

const Planet: FC<{ onClick: any }> = ({ onClick }) => (
  <div className="planet-svg">
    <svg
      width="2917"
      height="1641"
      viewBox="0 0 2917 1641"
      fill="none"
      preserveAspectRatio="xMidYMin slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="milestones">
        <g id="milestone-path">
          <ellipse
            cx="677.5"
            cy="832"
            rx="62.5"
            ry="63"
            fill="url(#paint0_linear_330_200)"
          />
          <ellipse
            cx="677.5"
            cy="832"
            rx="62.5"
            ry="63"
            fill="url(#paint1_radial_330_200)"
            fillOpacity="0.2"
          />
        </g>
        <g id="milestone-path2">
          <ellipse
            cx="2255.5"
            cy="888"
            rx="47.5"
            ry="47"
            transform="rotate(-180 2255.5 888)"
            fill="url(#paint2_linear_330_200)"
          />
          <ellipse
            cx="2255.5"
            cy="888"
            rx="47.5"
            ry="47"
            transform="rotate(-180 2255.5 888)"
            fill="url(#paint3_radial_330_200)"
            fillOpacity="0.2"
          />
        </g>
        <g id="milestone-path3">
          <circle cx="873" cy="956" r="53" fill="url(#paint4_linear_330_200)" />
          <circle
            cx="873"
            cy="956"
            r="53"
            fill="url(#paint5_radial_330_200)"
            fillOpacity="0.2"
          />
        </g>
        <g id="milestone-path4">
          <ellipse
            cx="2037.5"
            cy="860.5"
            rx="47.5"
            ry="48.5"
            transform="rotate(-180 2037.5 860.5)"
            fill="url(#paint6_linear_330_200)"
          />
          <ellipse
            cx="2037.5"
            cy="860.5"
            rx="47.5"
            ry="48.5"
            transform="rotate(-180 2037.5 860.5)"
            fill="url(#paint7_radial_330_200)"
            fillOpacity="0.2"
          />
        </g>
        <g id="milestone-path5">
          <ellipse
            cx="1102.5"
            cy="977"
            rx="47.5"
            ry="47"
            fill="url(#paint8_linear_330_200)"
          />
          <ellipse
            cx="1102.5"
            cy="977"
            rx="47.5"
            ry="47"
            fill="url(#paint9_radial_330_200)"
            fillOpacity="0.2"
          />
        </g>
        <g id="milestone-path6">
          <circle
            cx="1849"
            cy="1003"
            r="77"
            transform="rotate(-180 1849 1003)"
            fill="url(#paint10_linear_330_200)"
          />
          <circle
            cx="1849"
            cy="1003"
            r="77"
            transform="rotate(-180 1849 1003)"
            fill="url(#paint11_radial_330_200)"
            fillOpacity="0.2"
          />
        </g>
      </g>

      <g id="planet-path-duplicate">
        <g filter="url(#filter4_d_330_200)">
          <path
            d="M1648.37 563.762C1647.56 677.386 1552.79 768.819 1436.69 767.983C1320.59 767.147 1227.13 674.358 1227.94 560.734C1228.75 447.11 1323.53 355.678 1439.62 356.514C1555.72 357.35 1649.18 450.138 1648.37 563.762Z"
            fill="url(#paint12_linear_330_200)"
          />
        </g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1228.49 584.486C1227.8 577.787 1227.46 570.992 1227.48 564.118C1227.49 561.947 1227.53 559.784 1227.61 557.629C1124.09 598.857 1058.97 640.833 1066.18 667.038C1077.2 707.072 1252.83 695.142 1458.46 640.392C1664.1 585.642 1821.87 508.804 1810.85 468.771C1803.61 442.437 1725.14 438.587 1613.76 454.618C1619.22 462.623 1624.11 471.022 1628.36 479.762C1673.49 475.319 1702.33 477.492 1704.97 487.388C1710.59 508.406 1595.92 556.303 1448.84 594.37C1301.77 632.436 1177.98 646.256 1172.36 625.238C1169.86 615.892 1191.15 601.233 1228.49 584.486Z"
          fill="url(#paint13_linear_330_200)"
        />
      </g>
      <g id="planet-line-duplicate" filter="url(#filter2_d_330_200)">
        <path d="M1309 404L1237.35 329H1136" stroke="white" strokeWidth="4" />
      </g>
      <g id="planet-label-duplicate" filter="url(#filter3_d_330_200)">
        <path
          d="M1168.34 278V309H1159.48V293.899L1152.57 305.501H1151.77L1144.86 293.899V309H1136V278H1144.86L1152.17 290.621L1159.48 278H1168.34Z"
          fill="#ECECEC"
        />
        <path
          d="M1190.72 309L1189.65 305.014H1180.71L1179.64 309H1170.12L1180 278H1190.36L1200.24 309H1190.72ZM1182.61 297.929H1187.75L1185.18 288.407L1182.61 297.929Z"
          fill="#ECECEC"
        />
        <path d="M1202.02 278H1210.88V309H1202.02V278Z" fill="#ECECEC" />
        <path
          d="M1232.14 278H1241V309H1233.91L1224.16 294.829V309H1215.3V278H1222.39L1232.14 292.171V278Z"
          fill="#ECECEC"
        />
      </g>
      <g onClick={onClick} id="planet-path">
        <g filter="url(#filter4_d_330_200)">
          <path
            d="M1648.37 563.762C1647.56 677.386 1552.79 768.819 1436.69 767.983C1320.59 767.147 1227.13 674.358 1227.94 560.734C1228.75 447.11 1323.53 355.678 1439.62 356.514C1555.72 357.35 1649.18 450.138 1648.37 563.762Z"
            fill="url(#paint12_linear_330_200)"
          />
        </g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1228.49 584.486C1227.8 577.787 1227.46 570.992 1227.48 564.118C1227.49 561.947 1227.53 559.784 1227.61 557.629C1124.09 598.857 1058.97 640.833 1066.18 667.038C1077.2 707.072 1252.83 695.142 1458.46 640.392C1664.1 585.642 1821.87 508.804 1810.85 468.771C1803.61 442.437 1725.14 438.587 1613.76 454.618C1619.22 462.623 1624.11 471.022 1628.36 479.762C1673.49 475.319 1702.33 477.492 1704.97 487.388C1710.59 508.406 1595.92 556.303 1448.84 594.37C1301.77 632.436 1177.98 646.256 1172.36 625.238C1169.86 615.892 1191.15 601.233 1228.49 584.486Z"
          fill="url(#paint13_linear_330_200)"
        />
      </g>
      <g id="planet-line" filter="url(#filter2_d_330_200)">
        <path d="M1309 404L1237.35 329H1136" stroke="white" strokeWidth="4" />
      </g>
      <g id="planet-label" filter="url(#filter3_d_330_200)">
        <path
          d="M1168.34 278V309H1159.48V293.899L1152.57 305.501H1151.77L1144.86 293.899V309H1136V278H1144.86L1152.17 290.621L1159.48 278H1168.34Z"
          fill="#ECECEC"
        />
        <path
          d="M1190.72 309L1189.65 305.014H1180.71L1179.64 309H1170.12L1180 278H1190.36L1200.24 309H1190.72ZM1182.61 297.929H1187.75L1185.18 288.407L1182.61 297.929Z"
          fill="#ECECEC"
        />
        <path d="M1202.02 278H1210.88V309H1202.02V278Z" fill="#ECECEC" />
        <path
          d="M1232.14 278H1241V309H1233.91L1224.16 294.829V309H1215.3V278H1222.39L1232.14 292.171V278Z"
          fill="#ECECEC"
        />
      </g>

      <defs>
        <filter
          id="filter2_d_330_200"
          x="1086"
          y="277"
          width="274.446"
          height="178.382"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="25" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.19566 0 0 0 0 0.499771 0 0 0 0 0.670833 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_330_200"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_330_200"
            result="shape"
          />
        </filter>
        <filter
          id="filter3_d_330_200"
          x="1126"
          y="268"
          width="125"
          height="51"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.19566 0 0 0 0 0.499771 0 0 0 0 0.670833 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_330_200"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_330_200"
            result="shape"
          />
        </filter>
        <filter
          id="filter4_d_330_200"
          x="1192.94"
          y="321.508"
          width="490.437"
          height="481.48"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="17.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.843889 0 0 0 0 0.847467 0 0 0 0 0.933333 0 0 0 0.22 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_330_200"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_330_200"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear_330_200"
          x1="615"
          y1="832"
          x2="740"
          y2="832"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF512F" />
          <stop offset="1" stopColor="#F09819" />
        </linearGradient>
        <radialGradient
          id="paint1_radial_330_200"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(699.821 823) rotate(107.224) scale(75.3807 74.8878)"
        >
          <stop stopColor="white" />
          <stop offset="0.337066" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint2_linear_330_200"
          x1="2208"
          y1="888"
          x2="2303"
          y2="888"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF512F" />
          <stop offset="1" stopColor="#F09819" />
        </linearGradient>
        <radialGradient
          id="paint3_radial_330_200"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(2272.46 881.286) rotate(107.527) scale(56.3295 56.8206)"
        >
          <stop stopColor="white" />
          <stop offset="0.337066" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint4_linear_330_200"
          x1="820"
          y1="956"
          x2="926"
          y2="956"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF512F" />
          <stop offset="1" stopColor="#F09819" />
        </linearGradient>
        <radialGradient
          id="paint5_radial_330_200"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(891.929 948.429) rotate(107.354) scale(63.4601)"
        >
          <stop stopColor="white" />
          <stop offset="0.337066" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint6_linear_330_200"
          x1="1990"
          y1="860.5"
          x2="2085"
          y2="860.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF512F" />
          <stop offset="1" stopColor="#F09819" />
        </linearGradient>
        <radialGradient
          id="paint7_radial_330_200"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(2054.46 853.571) rotate(107.017) scale(57.9665 56.9782)"
        >
          <stop stopColor="white" />
          <stop offset="0.337066" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint8_linear_330_200"
          x1="1055"
          y1="977"
          x2="1150"
          y2="977"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF512F" />
          <stop offset="1" stopColor="#F09819" />
        </linearGradient>
        <radialGradient
          id="paint9_radial_330_200"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(1119.46 970.286) rotate(107.527) scale(56.3295 56.8206)"
        >
          <stop stopColor="white" />
          <stop offset="0.337066" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint10_linear_330_200"
          x1="1772"
          y1="1003"
          x2="1926"
          y2="1003"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF512F" />
          <stop offset="1" stopColor="#F09819" />
        </linearGradient>
        <radialGradient
          id="paint11_radial_330_200"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(1876.5 992) rotate(107.354) scale(92.1968)"
        >
          <stop stopColor="white" />
          <stop offset="0.337066" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="paint12_linear_330_200"
          x1="1347.08"
          y1="388.625"
          x2="1507.3"
          y2="679.55"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.032147" stopColor="#A570B7" />
          <stop offset="1" stopColor="#472DA1" />
        </linearGradient>
        <linearGradient
          id="paint13_linear_330_200"
          x1="1270.42"
          y1="460.062"
          x2="1274.97"
          y2="738.056"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0343214" stopColor="#6743A6" />
          <stop offset="0.283227" stopColor="#7A40A7" />
          <stop offset="0.344337" stopColor="#B858B3" />
          <stop offset="0.410548" stopColor="#E078C5" />
          <stop offset="0.44508" stopColor="#F197DB" />
          <stop offset="0.492386" stopColor="#E19ACE" />
          <stop offset="0.656257" stopColor="#E9AAE2" />
          <stop offset="0.854953" stopColor="#E0D1E1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default Planet;
