import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import imageLoader from "../../../../helpers/imageLoader";
import { toClientAbsoluteUrl } from "../../../../helpers/getClientOrigin";

const ResultsWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 20000;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f9fd;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .placeholder-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: var(--font-weight-semibold);
  }

  span {
    font-size: 14px;
    color: #070b35;
    font-weight: var(--font-weight-medium);
  }
`;

const NoResults = styled.div`
  padding: 16px;
  text-align: center;
  color: #738094;
  font-size: 14px;
`;

interface SearchResultsProps {
  isVisible: boolean;
  results: Array<{ _id: string; name: string; logo?: string; type?: string; label?: string }>;
  onSelect: (item: any) => void;
  isLoading?: boolean;
  // optional ref to the element the dropdown should be positioned under
  anchorRef?: React.RefObject<HTMLElement>;
  // position above anchor on mobile
  positionAboveOnMobile?: boolean;
}

const SearchResultsPortal: React.FC<SearchResultsProps> = ({
  isVisible,
  results,
  onSelect,
  isLoading = false,
  anchorRef,
  positionAboveOnMobile = false,
}) => {
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(
    null
  );

  const getImageSrc = (logo: string) => {
    if (logo.startsWith("/")) {
      return toClientAbsoluteUrl(logo);
    }

    return imageLoader(logo);
  };

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorRef || !anchorRef.current) {
        setPortalStyle(null);
        return;
      }

      const rect = anchorRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;

      let top: number;

      if (positionAboveOnMobile && isMobile) {
        // Position above the input on mobile
        const itemHeight = 56; // approximate height per item
        const padding = 16;
        const maxHeight = 300;
        const resultsHeight = Math.min(
          (results.length || 1) * itemHeight + padding,
          maxHeight
        );
        top = rect.top + window.scrollY - resultsHeight; // 8px gap from input
      } else {
        // Position below the input (default)
        top = rect.bottom + window.scrollY + 4;
      }

      const left = rect.left + window.scrollX;
      const width = rect.width;

      setPortalStyle({
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 20000,
      });
    };

    if (isVisible) updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, isVisible, positionAboveOnMobile, results.length]);

  const renderInner = (
    <ResultsWrapper isVisible={isVisible} style={portalStyle || undefined}>
      {isLoading ? (
        <NoResults>Loading...</NoResults>
      ) : results.length > 0 ? (
        results.map((item) => (
          <ResultItem key={item._id} onClick={() => onSelect(item)}>
            {item.logo ? (
              <img
                src={getImageSrc(item.logo)}
                alt={item.name}
              />
            ) : (
              <div className="placeholder-icon">
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{item.label || item.name}</span>
          </ResultItem>
        ))
      ) : (
        <NoResults>No results found</NoResults>
      )}
    </ResultsWrapper>
  );

  if (typeof document !== "undefined" && portalStyle) {
    return createPortal(renderInner, document.body);
  }

  return renderInner;
};

export default SearchResultsPortal;
