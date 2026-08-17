import React, { useRef, useEffect } from "react";

const MobileMilestones = () => {
  const milestones: any = useRef();
  const firstMilestone = useRef();
  const firstMilestoneLabel = useRef();
  const firstMilestoneLine = useRef();
  const secondMilestone = useRef();
  const secondMilestoneLabel = useRef();
  const secondMilestoneLine = useRef();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const milestonesGroups: any = [
    {
      mileStone: firstMilestone,
      label: firstMilestoneLabel,
      line: firstMilestoneLine,
    },
    {
      mileStone: secondMilestone,
      label: secondMilestoneLabel,
      line: secondMilestoneLine,
    },
  ];

  useEffect(() => {
    milestones?.current.addEventListener("scroll", () => {
      milestonesGroups.forEach((milestoneGroup: any) => {
        milestoneGroup.x =
          milestoneGroup.mileStone.current.getBoundingClientRect().left;
        if (milestoneGroup.x < 300 && milestoneGroup.x > 70) {
          milestoneGroup.label.current.style.opacity = "1";
          milestoneGroup.line.current.style.strokeDashoffset = "0";
        } else {
          milestoneGroup.label.current.style.opacity = "0";
          milestoneGroup.line.current.style.strokeDashoffset = "150";
        }
      });
    });
  }, [milestonesGroups]);

  return (
    <div ref={milestones} className="mobile-milestones">
      <svg
        width="2337"
        height="400"
        viewBox="0 0 2337 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          // @ts-ignore
          ref={firstMilestone}
          id="first-milestone"
          filter="url(#filter2_d_405_205)"
        >
          <circle
            cx="255.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint0_linear_405_205)"
          />
          <circle
            cx="255.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint1_radial_405_205)"
            fillOpacity="0.2"
          />
        </g>
        {/*@ts-ignore*/}
        <g
          // @ts-ignore
          ref={firstMilestoneLabel}
          id="first-milestone-label"
          filter="url(#filter1_d_405_205)"
        >
          <path
            d="M66.408 330.6C66.408 332.568 65.84 334.32 64.704 335.856L66.048 337.32L62.76 340.2L61.272 338.592C60.088 339.12 58.832 339.384 57.504 339.384C55.008 339.384 52.896 338.544 51.168 336.864C49.456 335.168 48.6 333.08 48.6 330.6C48.6 328.12 49.456 326.04 51.168 324.36C52.896 322.664 55.008 321.816 57.504 321.816C60 321.816 62.104 322.664 63.816 324.36C65.544 326.04 66.408 328.12 66.408 330.6ZM57.504 334.68H57.672L55.608 332.424L58.92 329.568L61.32 332.184C61.512 331.704 61.608 331.176 61.608 330.6C61.608 329.432 61.216 328.464 60.432 327.696C59.664 326.912 58.688 326.52 57.504 326.52C56.32 326.52 55.336 326.912 54.552 327.696C53.784 328.464 53.4 329.432 53.4 330.6C53.4 331.768 53.784 332.744 54.552 333.528C55.336 334.296 56.32 334.68 57.504 334.68ZM71.3843 322.2H75.4643V339H70.6643V327.216L67.7603 327.912L66.6562 323.904L71.3843 322.2ZM82.1831 339V335.496L87.6551 329.568C87.7511 329.456 87.8871 329.304 88.0631 329.112C88.2551 328.92 88.3831 328.784 88.4471 328.704C88.5271 328.624 88.6231 328.52 88.7351 328.392C88.8631 328.248 88.9431 328.136 88.9751 328.056C89.0231 327.96 89.0631 327.864 89.0951 327.768C89.1431 327.656 89.1671 327.544 89.1671 327.432C89.1671 327.16 89.0711 326.936 88.8791 326.76C88.6871 326.568 88.4071 326.472 88.0391 326.472C87.1431 326.472 86.4791 327.04 86.0471 328.176L81.8231 325.872C82.3831 324.544 83.2071 323.536 84.2951 322.848C85.3991 322.16 86.6231 321.816 87.9671 321.816C89.6151 321.816 91.0231 322.288 92.1911 323.232C93.3751 324.16 93.9671 325.448 93.9671 327.096C93.9671 328.104 93.7431 328.984 93.2951 329.736C92.8631 330.488 92.1751 331.392 91.2311 332.448L89.5271 334.344H94.3271V339H82.1831ZM107.48 337.008C106.248 338.592 104.504 339.384 102.248 339.384C99.9915 339.384 98.2475 338.592 97.0155 337.008C95.7835 335.408 95.1675 333.272 95.1675 330.6C95.1675 327.928 95.7835 325.8 97.0155 324.216C98.2475 322.616 99.9915 321.816 102.248 321.816C104.504 321.816 106.248 322.616 107.48 324.216C108.712 325.8 109.328 327.928 109.328 330.6C109.328 333.272 108.712 335.408 107.48 337.008ZM99.9675 330.6C99.9675 333.352 100.728 334.728 102.248 334.728C103.768 334.728 104.528 333.352 104.528 330.6C104.528 327.848 103.768 326.472 102.248 326.472C100.728 326.472 99.9675 327.848 99.9675 330.6ZM110.05 339V335.496L115.522 329.568C115.618 329.456 115.754 329.304 115.93 329.112C116.122 328.92 116.25 328.784 116.314 328.704C116.394 328.624 116.49 328.52 116.602 328.392C116.73 328.248 116.81 328.136 116.842 328.056C116.89 327.96 116.93 327.864 116.962 327.768C117.01 327.656 117.034 327.544 117.034 327.432C117.034 327.16 116.938 326.936 116.746 326.76C116.554 326.568 116.274 326.472 115.906 326.472C115.01 326.472 114.346 327.04 113.914 328.176L109.69 325.872C110.25 324.544 111.074 323.536 112.162 322.848C113.266 322.16 114.49 321.816 115.834 321.816C117.482 321.816 118.89 322.288 120.058 323.232C121.242 324.16 121.834 325.448 121.834 327.096C121.834 328.104 121.61 328.984 121.162 329.736C120.73 330.488 120.042 331.392 119.098 332.448L117.394 334.344H122.194V339H110.05ZM123.152 339V335.496L128.624 329.568C128.72 329.456 128.856 329.304 129.032 329.112C129.224 328.92 129.352 328.784 129.416 328.704C129.496 328.624 129.592 328.52 129.704 328.392C129.832 328.248 129.912 328.136 129.944 328.056C129.992 327.96 130.032 327.864 130.064 327.768C130.112 327.656 130.136 327.544 130.136 327.432C130.136 327.16 130.04 326.936 129.848 326.76C129.656 326.568 129.376 326.472 129.008 326.472C128.112 326.472 127.448 327.04 127.016 328.176L122.792 325.872C123.352 324.544 124.176 323.536 125.264 322.848C126.368 322.16 127.592 321.816 128.936 321.816C130.584 321.816 131.992 322.288 133.16 323.232C134.344 324.16 134.936 325.448 134.936 327.096C134.936 328.104 134.712 328.984 134.264 329.736C133.832 330.488 133.144 331.392 132.2 332.448L130.496 334.344H135.296V339H123.152Z"
            fill="#ECECEC"
          />
        </g>
        {/*@ts-ignore*/}
        <g
          // @ts-ignore
          ref={firstMilestoneLine}
          id="first-milestone-line"
          filter="url(#filter0_d_405_205)"
        >
          <path d="M179 308L138 349H50" stroke="white" strokeWidth="2" />
        </g>

        <g filter="url(#filter3_d_405_205)">
          <circle
            id="third-milestone"
            cx="1011.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint2_linear_405_205)"
          />
          <circle
            cx="1011.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint3_radial_405_205)"
            fillOpacity="0.2"
          />
        </g>
        <g filter="url(#filter4_d_405_205)">
          <circle
            id="fourth-milestone"
            cx="1389.5"
            cy="187.5"
            r="141.5"
            fill="url(#paint4_linear_405_205)"
          />
          <circle
            cx="1389.5"
            cy="187.5"
            r="141.5"
            fill="url(#paint5_radial_405_205)"
            fillOpacity="0.2"
          />
        </g>
        <g filter="url(#filter5_d_405_205)">
          <circle
            id="fifth-milestone"
            cx="1767.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint6_linear_405_205)"
          />
          <circle
            cx="1767.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint7_radial_405_205)"
            fillOpacity="0.2"
          />
        </g>
        <g filter="url(#filter6_d_405_205)">
          <circle
            id="sixth-milestone"
            cx="2145.5"
            cy="187.5"
            r="141.5"
            fill="url(#paint8_linear_405_205)"
          />
          <circle
            cx="2145.5"
            cy="187.5"
            r="141.5"
            fill="url(#paint9_radial_405_205)"
            fillOpacity="0.2"
          />
        </g>
        {/*@ts-ignore*/}
        <g
          // @ts-ignore
          ref={secondMilestone}
          id="second-milestone"
          filter="url(#filter9_d_405_205)"
        >
          <circle
            cx="633.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint10_linear_405_205)"
          />
          <circle
            cx="633.5"
            cy="191.5"
            r="141.5"
            fill="url(#paint11_radial_405_205)"
            fillOpacity="0.2"
          />
        </g>
        {/*@ts-ignore*/}
        <g
          // @ts-ignore
          ref={secondMilestoneLine}
          id="second-milestone-line"
          filter="url(#filter7_d_405_205)"
        >
          <path d="M561 308L520 349H432" stroke="white" strokeWidth="2" />
        </g>
        {/*@ts-ignore*/}
        <g
          // @ts-ignore
          ref={secondMilestoneLabel}
          id="second-milestone-label"
          filter="url(#filter8_d_405_205)"
        >
          <path
            d="M448.408 330.6C448.408 332.568 447.84 334.32 446.704 335.856L448.048 337.32L444.76 340.2L443.272 338.592C442.088 339.12 440.832 339.384 439.504 339.384C437.008 339.384 434.896 338.544 433.168 336.864C431.456 335.168 430.6 333.08 430.6 330.6C430.6 328.12 431.456 326.04 433.168 324.36C434.896 322.664 437.008 321.816 439.504 321.816C442 321.816 444.104 322.664 445.816 324.36C447.544 326.04 448.408 328.12 448.408 330.6ZM439.504 334.68H439.672L437.608 332.424L440.92 329.568L443.32 332.184C443.512 331.704 443.608 331.176 443.608 330.6C443.608 329.432 443.216 328.464 442.432 327.696C441.664 326.912 440.688 326.52 439.504 326.52C438.32 326.52 437.336 326.912 436.552 327.696C435.784 328.464 435.4 329.432 435.4 330.6C435.4 331.768 435.784 332.744 436.552 333.528C437.336 334.296 438.32 334.68 439.504 334.68ZM453.384 322.2H457.464V339H452.664V327.216L449.76 327.912L448.656 323.904L453.384 322.2ZM464.183 339V335.496L469.655 329.568C469.751 329.456 469.887 329.304 470.063 329.112C470.255 328.92 470.383 328.784 470.447 328.704C470.527 328.624 470.623 328.52 470.735 328.392C470.863 328.248 470.943 328.136 470.975 328.056C471.023 327.96 471.063 327.864 471.095 327.768C471.143 327.656 471.167 327.544 471.167 327.432C471.167 327.16 471.071 326.936 470.879 326.76C470.687 326.568 470.407 326.472 470.039 326.472C469.143 326.472 468.479 327.04 468.047 328.176L463.823 325.872C464.383 324.544 465.207 323.536 466.295 322.848C467.399 322.16 468.623 321.816 469.967 321.816C471.615 321.816 473.023 322.288 474.191 323.232C475.375 324.16 475.967 325.448 475.967 327.096C475.967 328.104 475.743 328.984 475.295 329.736C474.863 330.488 474.175 331.392 473.231 332.448L471.527 334.344H476.327V339H464.183ZM489.48 337.008C488.248 338.592 486.504 339.384 484.248 339.384C481.992 339.384 480.248 338.592 479.016 337.008C477.784 335.408 477.168 333.272 477.168 330.6C477.168 327.928 477.784 325.8 479.016 324.216C480.248 322.616 481.992 321.816 484.248 321.816C486.504 321.816 488.248 322.616 489.48 324.216C490.712 325.8 491.328 327.928 491.328 330.6C491.328 333.272 490.712 335.408 489.48 337.008ZM481.968 330.6C481.968 333.352 482.728 334.728 484.248 334.728C485.768 334.728 486.528 333.352 486.528 330.6C486.528 327.848 485.768 326.472 484.248 326.472C482.728 326.472 481.968 327.848 481.968 330.6ZM492.05 339V335.496L497.522 329.568C497.618 329.456 497.754 329.304 497.93 329.112C498.122 328.92 498.25 328.784 498.314 328.704C498.394 328.624 498.49 328.52 498.602 328.392C498.73 328.248 498.81 328.136 498.842 328.056C498.89 327.96 498.93 327.864 498.962 327.768C499.01 327.656 499.034 327.544 499.034 327.432C499.034 327.16 498.938 326.936 498.746 326.76C498.554 326.568 498.274 326.472 497.906 326.472C497.01 326.472 496.346 327.04 495.914 328.176L491.69 325.872C492.25 324.544 493.074 323.536 494.162 322.848C495.266 322.16 496.49 321.816 497.834 321.816C499.482 321.816 500.89 322.288 502.058 323.232C503.242 324.16 503.834 325.448 503.834 327.096C503.834 328.104 503.61 328.984 503.162 329.736C502.73 330.488 502.042 331.392 501.098 332.448L499.394 334.344H504.194V339H492.05ZM505.152 339V335.496L510.624 329.568C510.72 329.456 510.856 329.304 511.032 329.112C511.224 328.92 511.352 328.784 511.416 328.704C511.496 328.624 511.592 328.52 511.704 328.392C511.832 328.248 511.912 328.136 511.944 328.056C511.992 327.96 512.032 327.864 512.064 327.768C512.112 327.656 512.136 327.544 512.136 327.432C512.136 327.16 512.04 326.936 511.848 326.76C511.656 326.568 511.376 326.472 511.008 326.472C510.112 326.472 509.448 327.04 509.016 328.176L504.792 325.872C505.352 324.544 506.176 323.536 507.264 322.848C508.368 322.16 509.592 321.816 510.936 321.816C512.584 321.816 513.992 322.288 515.16 323.232C516.344 324.16 516.936 325.448 516.936 327.096C516.936 328.104 516.712 328.984 516.264 329.736C515.832 330.488 515.144 331.392 514.2 332.448L512.496 334.344H517.296V339H505.152Z"
            fill="#ECECEC"
          />
        </g>
        <defs>
          <filter
            id="filter0_d_405_205"
            x="0"
            y="257.293"
            width="229.707"
            height="142.707"
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
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter1_d_405_205"
            x="38.5996"
            y="311.816"
            width="106.696"
            height="38.384"
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
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter2_d_405_205"
            x="64"
            y="4"
            width="383"
            height="383"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter3_d_405_205"
            x="820"
            y="4"
            width="383"
            height="383"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter4_d_405_205"
            x="1198"
            y="0"
            width="383"
            height="383"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter5_d_405_205"
            x="1576"
            y="4"
            width="383"
            height="383"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter6_d_405_205"
            x="1954"
            y="0"
            width="383"
            height="383"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter7_d_405_205"
            x="382"
            y="257.293"
            width="229.707"
            height="142.707"
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
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter8_d_405_205"
            x="420.6"
            y="311.816"
            width="106.696"
            height="38.384"
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
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <filter
            id="filter9_d_405_205"
            x="442"
            y="4"
            width="383"
            height="383"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_405_205"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_405_205"
              result="shape"
            />
          </filter>
          <linearGradient
            id="paint0_linear_405_205"
            x1="114"
            y1="191.5"
            x2="397"
            y2="191.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF512F" />
            <stop offset="1" stopColor="#F09819" />
          </linearGradient>
          <radialGradient
            id="paint1_radial_405_205"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(306.036 171.286) rotate(107.354) scale(169.427)"
          >
            <stop stopColor="white" />
            <stop offset="0.337066" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="paint2_linear_405_205"
            x1="870"
            y1="191.5"
            x2="1153"
            y2="191.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF512F" />
            <stop offset="1" stopColor="#F09819" />
          </linearGradient>
          <radialGradient
            id="paint3_radial_405_205"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1062.04 171.286) rotate(107.354) scale(169.427)"
          >
            <stop stopColor="white" />
            <stop offset="0.337066" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="paint4_linear_405_205"
            x1="1248"
            y1="187.5"
            x2="1531"
            y2="187.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF512F" />
            <stop offset="1" stopColor="#F09819" />
          </linearGradient>
          <radialGradient
            id="paint5_radial_405_205"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1440.04 167.286) rotate(107.354) scale(169.427)"
          >
            <stop stopColor="white" />
            <stop offset="0.337066" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="paint6_linear_405_205"
            x1="1626"
            y1="191.5"
            x2="1909"
            y2="191.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF512F" />
            <stop offset="1" stopColor="#F09819" />
          </linearGradient>
          <radialGradient
            id="paint7_radial_405_205"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1818.04 171.286) rotate(107.354) scale(169.427)"
          >
            <stop stopColor="white" />
            <stop offset="0.337066" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="paint8_linear_405_205"
            x1="2004"
            y1="187.5"
            x2="2287"
            y2="187.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF512F" />
            <stop offset="1" stopColor="#F09819" />
          </linearGradient>
          <radialGradient
            id="paint9_radial_405_205"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(2196.04 167.286) rotate(107.354) scale(169.427)"
          >
            <stop stopColor="white" />
            <stop offset="0.337066" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="paint10_linear_405_205"
            x1="492"
            y1="191.5"
            x2="775"
            y2="191.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF512F" />
            <stop offset="1" stopColor="#F09819" />
          </linearGradient>
          <radialGradient
            id="paint11_radial_405_205"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(684.036 171.286) rotate(107.354) scale(169.427)"
          >
            <stop stopColor="white" />
            <stop offset="0.337066" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export default MobileMilestones;
