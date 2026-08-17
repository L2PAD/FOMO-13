import styled from "styled-components";
import LaunchpadPlacementBanner from "../../global/LaunchpadPlacementBanner";

export const HeaderCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 10px;
  width: 100%;
  gap: 16px;
  margin-top: 20px;

  flex-wrap: wrap;
`;

export const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
    align-items: flex-start;
  }
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  line-height: 38px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const AdBanner = styled.div`
  display: flex;
  align-items: center;
  height: 38px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
`;

export const AdLeft = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  height: 100%;
  background: linear-gradient(to right, #0fa4e9, #369ef5);
`;

export const AdBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px 8px;
  font-family: Gilroy, sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const AdRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  height: 100%;
  border-top: 1px solid #369ef5;
  border-right: 1px solid #369ef5;
  border-bottom: 1px solid #369ef5;
  border-radius: 0 8px 8px 0;
`;

export const AdProjectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AdProjectAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
`;

export const AdPlacementBanner = styled(LaunchpadPlacementBanner)`
  display: block;
  width: 52px;
  height: 30px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 5px;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
`;

export const AdProjectAvatarFallback = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000530;
  color: var(--color-white);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
`;

export const AdProjectName = styled.span`
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const AdStatusBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7feff;
  border-radius: 6px;
  padding: 4px 10px;
  font-family: Gilroy, sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
  color: var(--color-info);
  white-space: nowrap;
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  .search-dropdown input::placeholder {
    color: var(--color-text-soft);
    font-family: Gilroy;
    font-size: 16px;
    font-style: normal;
    font-weight: var(--font-weight-regular);
    line-height: normal;
  }
  @media (max-width: 900px) {
    flex-wrap: wrap;
    gap: 12px;
  }

  @media (max-width: 600px) {
    button {
      width: 100%;
    }
  }
`;

export const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  width: 100px;
  padding: 8px;
  border-radius: 8px;
  background: #f9f9f9;
  cursor: text;
  flex-shrink: 0;
`;

export const SearchPlaceholder = styled.span`
  font-size: 16px;
  color: var(--color-text-soft);
  white-space: nowrap;
`;

export const FilterDropdown = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  width: 160px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
  background: var(--color-white);
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--color-border);
  }

  .filter-inner {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
  }
`;

export const FilterLabelText = styled.span`
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const FilterCount = styled.span`
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const FilterDropdownWrapper = styled.div`
  width: 160px;
  flex-shrink: 0;
`;

export const NftWidget = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
`;

export const NftInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  order: 1;
`;

export const NftTitle = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const NftSubtitle = styled.p<{ $color?: string }>`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ $color }) => $color ?? "var(--color-primary)"};
  transition: color 0.2s ease;
`;

/* ── AdBanner popover ── */

export const AdBannerWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
`;

export const AdPopover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 200;
  width: 400px;
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const AdPopoverHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const AdPopoverTitle = styled.p`
  font-family: Gilroy, sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const AdPopoverStatusBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7feff;
  border-radius: 6px;
  padding: 4px 10px;
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-info);
  white-space: nowrap;
`;

export const AdPopoverDivider = styled.hr`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
  border: none;
  margin: 0;
  flex-shrink: 0;
`;

export const AdPopoverRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
`;

export const AdPopoverRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  white-space: nowrap;
`;

export const AdPopoverLabel = styled.span`
  color: #728094;
`;

export const AdPopoverValue = styled.span`
  color: var(--color-text-primary);
`;

export const AdPopoverProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const AdPopoverProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;
`;

export const AdPopoverProgressLabel = styled.span`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
`;

export const AdPopoverProgressValue = styled.span`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
`;

export const AdPopoverProgressTrack = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
`;

export const AdPopoverProgressFill = styled.div<{ $percent: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: 8px;
  background: linear-gradient(to right, #1dc28c, var(--color-primary));
`;

export const AdPopoverDescription = styled.p`
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  width: 100%;

  strong {
    font-weight: var(--font-weight-semibold);
    color: #728094;
  }
`;

export const AdPopoverProjectRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

export const AdPopoverProjectAvatar = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
`;

export const AdPopoverProjectAvatarFallback = styled.span`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000530;
  color: var(--color-white);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
`;

export const AdPopoverProjectDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const AdPopoverProjectName = styled.p`
  font-family: Gilroy, sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const AdPopoverProjectCategories = styled.p`
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const AdPopoverButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 12px;
  background: var(--color-info);
  border: none;
  border-radius: 8px;
  font-family: Gilroy, sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-white);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #1a6ecb;
  }
`;
