import React, { FC, useEffect, useRef, useState } from "react";
import { TabWrapper, TabStyle, SoonLabel, TabLogo } from "./styles";
import InfoIcon from "../../Icons/InfoIcon";
import DescriptionComponent from "../../common/DescriptionComponent";
import imageLoader from "../../../../helpers/imageLoader";
import { useTranslation } from "i18n";

export interface TabInterface {
  item: string;
  logo?: string
  active: boolean;
  onClick: (value: string) => void;
  disabled?: boolean;
  description?: { text: string; index: number } | undefined;
}

const Tab: FC<TabInterface> = ({
  item,
  logo,
  active,
  onClick,
  disabled,
  description,
}) => {
  const { translateText } = useTranslation();
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const descriptionButtonRef = useRef<HTMLButtonElement | null>(null);

  const updateTooltipPosition = () => {
    const rect = descriptionButtonRef.current?.getBoundingClientRect();

    if (!rect) return;

    const tooltipWidth = 320;
    const viewportPadding = 16;
    const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const nextLeft = Math.min(
      Math.max(centeredLeft, viewportPadding),
      window.innerWidth - tooltipWidth - viewportPadding
    );

    setTooltipPosition({
      top: rect.bottom + 8,
      left: nextLeft,
    });
  };

  useEffect(() => {
    if (!isDescription) return undefined;

    updateTooltipPosition();

    const syncTooltipPosition = () => updateTooltipPosition();

    window.addEventListener("resize", syncTooltipPosition);
    window.addEventListener("scroll", syncTooltipPosition, true);

    return () => {
      window.removeEventListener("resize", syncTooltipPosition);
      window.removeEventListener("scroll", syncTooltipPosition, true);
    };
  }, [isDescription]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(item);
      return;
    }

    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    const tabList = event.currentTarget.closest('[role="tablist"]');
    const tabs = Array.from(
      tabList?.querySelectorAll<HTMLElement>(
        '[role="tab"]:not([aria-disabled="true"])'
      ) || []
    );
    const currentIndex = tabs.indexOf(event.currentTarget);

    if (currentIndex < 0 || tabs.length < 2) return;

    event.preventDefault();

    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % tabs.length
            : (currentIndex - 1 + tabs.length) % tabs.length;

    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  };

  return (
    <TabWrapper className="tab-wrapper">
      {disabled ? <SoonLabel>{translateText("Soon")}</SoonLabel> : <></>}
      <TabStyle
        disabled={disabled}
        onClick={() => !disabled && onClick(item)}
        onKeyDown={handleKeyDown}
        active={active}
        className={active ? "active tab" : "tab"}
        role="tab"
        tabIndex={disabled ? -1 : active ? 0 : -1}
        aria-selected={active}
        aria-disabled={Boolean(disabled)}
      >
        {
          logo
            ?
            <TabLogo
              src={imageLoader(logo)}
              alt="tab"
            />
            :
            <></>
        }
        {translateText(item)}
      </TabStyle>
      {description ? (
        <button
          ref={descriptionButtonRef}
          onMouseEnter={() => setIsDescription(true)}
          onMouseLeave={() => setIsDescription(false)}
          className="description-btn"
        >
          <InfoIcon />
        </button>
      ) : (
        <></>
      )}
      {description ? (
        <DescriptionComponent
          className="tab-description"
          isVisible={isDescription}
          date={new Date()}
          isDate={false}
          text={translateText(description.text)}
          style={tooltipPosition}
        />
      ) : (
        <></>
      )}
    </TabWrapper>
  );
};

export default Tab;
