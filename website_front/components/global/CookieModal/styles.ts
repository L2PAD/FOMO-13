import styled, { css, keyframes } from 'styled-components';

const breakpoints = {
    sm: '640px',
    md: '768px',
};

const pulse = keyframes`
    0%, 100% {
        opacity: 0.5;
    }
    50% {
        opacity: 0.25;
    }
`;

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const slideUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(100px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const scaleIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

const overlayStyles = css`
    position: fixed;
    inset: 0;
`;

export const ScreenOverlay = styled.div`
    ${overlayStyles};
    z-index: 9998;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(2px);
    animation: ${fadeIn} 0.2s ease forwards;
`;

export const BannerRoot = styled.div`
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 9999;
    padding: 12px 12px 16px;
    animation: ${slideUp} 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    @media (min-width: ${breakpoints.md}) {
        padding: 16px 16px 24px;
    }
`;

export const BannerMaxWidth = styled.div`
    max-width: 64rem;
    margin: 0 auto;
`;

export const BannerCard = styled.div`
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(229, 231, 235, 0.8);
    border-radius: 24px;
    box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 10px 15px -3px rgba(0, 0, 0, 0.1);
`;

export const BannerGradient = styled.div`
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-white) 0%, var(--color-surface-subtle) 50%, rgba(236, 253, 245, 0.3) 100%);
`;

export const AccentLine = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, #34d399 0%, #2dd4bf 50%, #22d3ee 100%);
`;

export const AccentPulse = styled.div`
    position: absolute;
    inset: 0;
    background: inherit;
    animation: ${pulse} 2s ease-in-out infinite;
`;

export const BannerContent = styled.div`
    position: relative;
    padding: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);

    @media (min-width: ${breakpoints.md}) {
        padding: 20px;
    }
`;

export const ContentLayout = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    @media (min-width: ${breakpoints.md}) {
        flex-direction: row;
        align-items: center;
        gap: 16px;
    }
`;

export const MainColumn = styled.div`
    flex: 1;
    width: 100%;
`;

export const HeroRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
`;

export const HeroIcon = styled.div`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #34d399 0%, #14b8a6 100%);
    box-shadow:
        0 10px 15px -3px rgba(16, 185, 129, 0.2),
        0 4px 6px -4px rgba(16, 185, 129, 0.2);

    svg {
        width: 20px;
        height: 20px;
        color: var(--color-white);
    }
`;

export const TextColumn = styled.div`
    flex: 1;
    min-width: 0;
`;

export const Title = styled.h3`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    color: var(--color-text-strong);
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.35;

    @media (min-width: ${breakpoints.md}) {
        font-size: 18px;
    }
`;

export const TitleLabel = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
`;

export const RequiredBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border: 1px solid #a7f3d0;
    border-radius: 999px;
    background: #d1fae5;
    color: #047857;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
`;

export const Description = styled.p`
    display: none;
    margin: 0 0 12px;
    color: #4b5563;
    font-size: 14px;
    line-height: 1.625;

    @media (min-width: ${breakpoints.sm}) {
        display: block;
    }
`;

export const ConsentGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const ConsentLabel = styled.label`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
`;

export const HiddenCheckbox = styled.input`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
`;

export const CheckboxVisual = styled.div<{ $checked: boolean }>`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 2px;
    border: 2px solid ${({ $checked }) => ($checked ? '#10b981' : '#d1d5db')};
    border-radius: 6px;
    background: ${({ $checked }) =>
        $checked
            ? 'linear-gradient(135deg, #34d399 0%, #14b8a6 100%)'
            : 'var(--color-white)'};
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition: all 0.2s ease;

    ${ConsentLabel}:hover & {
        border-color: #34d399;
    }

    svg {
        width: 100%;
        height: 100%;
        color: var(--color-white);
        opacity: ${({ $checked }) => ($checked ? 1 : 0)};
        transition: opacity 0.2s ease;
    }
`;

export const ConsentText = styled.div`
    flex: 1;
    min-width: 0;
`;

export const ConsentTitle = styled.span`
    display: block;
    color: var(--color-text-strong);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
`;

export const ConsentDescription = styled.p`
    display: none;
    margin: 2px 0 0;
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 1.35;

    @media (min-width: ${breakpoints.sm}) {
        display: block;
    }
`;

export const InlineLink = styled.button`
    padding: 0;
    border: 0;
    background: none;
    color: #059669;
    font: inherit;
    font-weight: var(--font-weight-medium);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
        color: #047857;
    }
`;

export const DetailsMotion = styled.div<{ $isOpen: boolean }>`
    overflow: hidden;
    max-height: ${({ $isOpen }) => ($isOpen ? '480px' : '0')};
    margin-top: ${({ $isOpen }) => ($isOpen ? '12px' : '0')};
    opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
    visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
    transition:
        max-height 0.3s ease,
        margin-top 0.3s ease,
        opacity 0.25s ease,
        visibility 0s linear ${({ $isOpen }) => ($isOpen ? '0s' : '0.3s')};
`;

export const DetailsCard = styled.div`
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--color-surface-subtle) 0%, rgba(236, 253, 245, 0.3) 100%);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
`;

export const DetailsTitle = styled.h4`
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 0 8px;
    color: #047857;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const DetailsList = styled.ul`
    margin: 0 0 8px 4px;
    padding-left: 16px;
    color: #374151;
    font-size: 12px;
    line-height: 1.4;

    li + li {
        margin-top: 6px;
    }
`;

export const NoticeBox = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.5);
    color: #4b5563;
    font-size: 12px;
    line-height: 1.4;

    svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        margin-top: 2px;
        color: #059669;
    }

    p {
        flex: 1;
        margin: 0;
    }
`;

export const ActionsColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;

    @media (min-width: ${breakpoints.md}) {
        width: auto;
        min-width: 150px;
    }
`;

export const AcceptButton = styled.button<{ $enabled: boolean }>`
    width: 100%;
    min-height: 44px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1;
    border: 0;
    border-radius: 999px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    transition: all 0.3s ease;
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08);
    -webkit-font-smoothing: antialiased;

    ${({ $enabled }) =>
        $enabled
            ? css`
                  background: linear-gradient(90deg, #10b981 0%, #14b8a6 100%);
                  color: var(--color-white);
                  cursor: pointer;

                  &:hover {
                      transform: scale(1.02);
                      background: linear-gradient(90deg, #059669 0%, #0d9488 100%);
                      box-shadow:
                          0 20px 25px -5px rgba(16, 185, 129, 0.3),
                          0 8px 10px -6px rgba(16, 185, 129, 0.2);
                  }
              `
            : css`
                  background: #e5e7eb;
                  color: #9ca3af;
                  cursor: not-allowed;
                  opacity: 0.6;
              `}
`;

export const AcceptContent = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    gap: 8px;

    svg {
        display: block;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }
`;

export const DetailsToggle = styled.button`
    padding: 8px 20px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: #059669;
        background: var(--color-surface-subtle);
    }
`;

export const ProgressRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
`;

export const ProgressTrack = styled.div`
    flex: 1;
    height: 6px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #f3f4f6;
`;

export const ProgressBar = styled.div<{ $progress: number }>`
    height: 100%;
    width: ${({ $progress }) => `${$progress}%`};
    background: linear-gradient(90deg, #34d399 0%, #14b8a6 100%);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    transition: width 0.3s ease;
`;

export const ProgressText = styled.span`
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
`;

export const SecureBadge = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 10px;
    color: #9ca3af;
    font-size: 12px;

    svg {
        width: 14px;
        height: 14px;
    }
`;

export const LegalOverlay = styled.div`
    ${overlayStyles};
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.6);
    animation: ${fadeIn} 0.2s ease forwards;
`;

export const LegalDialog = styled.div`
    width: 100%;
    max-width: 48rem;
    max-height: 80vh;
    overflow: hidden;
    border-radius: 16px;
    background: var(--color-white);
    box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.35),
        0 10px 15px -3px rgba(0, 0, 0, 0.12);
    animation: ${scaleIn} 0.2s ease forwards;
`;

export const LegalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(90deg, #ecfdf5 0%, #ccfbf1 100%);
`;

export const LegalTitle = styled.h2`
    margin: 0;
    color: #047857;
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
`;

export const LegalCloseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 10px;
    background: #f3f4f6;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #e5e7eb;
        color: #1f2937;
    }
`;

export const LegalBody = styled.div`
    max-height: calc(80vh - 80px);
    overflow-y: auto;
    padding: 24px;
`;

export const LegalText = styled.div`
    color: #374151;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
`;
