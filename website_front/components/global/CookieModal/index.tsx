import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API } from '../../../config/api';
import {
    AccentLine,
    AccentPulse,
    AcceptButton,
    AcceptContent,
    ActionsColumn,
    BannerCard,
    BannerContent,
    BannerGradient,
    BannerMaxWidth,
    BannerRoot,
    CheckboxVisual,
    ConsentDescription,
    ConsentGroup,
    ConsentLabel,
    ConsentText,
    ConsentTitle,
    ContentLayout,
    Description,
    DetailsCard,
    DetailsList,
    DetailsMotion,
    DetailsTitle,
    DetailsToggle,
    HeroIcon,
    HeroRow,
    HiddenCheckbox,
    InlineLink,
    MainColumn,
    NoticeBox,
    ProgressBar,
    ProgressRow,
    ProgressText,
    ProgressTrack,
    RequiredBadge,
    ScreenOverlay,
    SecureBadge,
    TextColumn,
    Title,
    TitleLabel,
} from './styles';

type CookieConsentSettings = {
    enabled?: boolean;
    title_en?: string;
    description_en?: string;
};

const isConsentValid = (raw: string | null): boolean => {
    if (!raw) return false;

    try {
        const parsed = JSON.parse(raw);
        return parsed?.cookies === true && parsed?.privacy === true && !!parsed?.timestamp;
    } catch {
        return false;
    }
};

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    // Soft gate: both consents are pre-accepted so the banner can be dismissed
    // with a single "Accept All" click — no manual checkbox ticking required.
    const [acceptedCookies, setAcceptedCookies] = useState(true);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [settings, setSettings] = useState<CookieConsentSettings | null>(null);

    useEffect(() => {
        // Migrate users who accepted with the old system
        const oldConsent = localStorage.getItem('isCookies');
        if (oldConsent === 'true') {
            localStorage.setItem(
                'fomo_consent',
                JSON.stringify({
                    cookies: true,
                    privacy: true,
                    timestamp: new Date().toISOString(),
                })
            );
            localStorage.removeItem('isCookies');
        }

        const consent = localStorage.getItem('fomo_consent');
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let isMounted = true;

        if (isConsentValid(consent)) {
            return;
        }

        fetch(`${API}/cookie-consent-settings`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data: CookieConsentSettings) => {
                if (!isMounted) return;

                setSettings(data);

                if (data.enabled !== false) {
                    timeoutId = setTimeout(() => {
                        if (isMounted) setIsVisible(true);
                    }, 1000);
                }
            })
            .catch(() => {
                // Endpoint may not exist yet — show banner with defaults
                timeoutId = setTimeout(() => {
                    if (isMounted) setIsVisible(true);
                }, 1000);
            });

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    const handleAccept = () => {
        // One-click accept — always persist consent.
        localStorage.setItem(
            'fomo_consent',
            JSON.stringify({
                cookies: true,
                privacy: true,
                timestamp: new Date().toISOString(),
            })
        );

        setIsVisible(false);
    };

    const allAccepted = acceptedCookies && acceptedPrivacy;
    const title = settings?.title_en || 'Cookie & Privacy Settings';
    const description =
        settings?.description_en ||
        'We value your privacy. Please accept our cookies and privacy policy to continue exploring the FOMO platform.';

    const acceptedCount = useMemo(
        () => Number(acceptedCookies) + Number(acceptedPrivacy),
        [acceptedCookies, acceptedPrivacy]
    );

    return (
        <>
            {isVisible && <ScreenOverlay />}

            {isVisible && (
                <BannerRoot>
                    <BannerMaxWidth>
                        <BannerCard>
                            <BannerGradient />
                            <AccentLine>
                                <AccentPulse />
                            </AccentLine>

                            <BannerContent>
                                <ContentLayout>
                                    <MainColumn>
                                        <HeroRow>
                                            <HeroIcon>
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                    />
                                                </svg>
                                            </HeroIcon>

                                            <TextColumn>
                                                <Title>
                                                    <TitleLabel>{title}</TitleLabel>
                                                    <RequiredBadge>Required</RequiredBadge>
                                                </Title>
                                                <Description>{description}</Description>

                                                <ConsentGroup>
                                                    <ConsentText>
                                                        <ConsentDescription>
                                                            By continuing you agree to our{' '}
                                                            <Link href="/legal?type=policy" target="_blank">
                                                                <InlineLink as="span">Cookie Policy</InlineLink>
                                                            </Link>
                                                            ,{' '}
                                                            <Link href="/legal?type=policy" target="_blank">
                                                                <InlineLink as="span">Privacy Policy</InlineLink>
                                                            </Link>{' '}
                                                            and{' '}
                                                            <Link href="/legal?type=terms" target="_blank">
                                                                <InlineLink as="span">Terms of Use</InlineLink>
                                                            </Link>
                                                            . Essential cookies are required for authentication and security.
                                                        </ConsentDescription>
                                                    </ConsentText>
                                                </ConsentGroup>

                                                <DetailsMotion $isOpen={showDetails} aria-hidden={!showDetails}>
                                                    <DetailsCard>
                                                        <DetailsTitle>
                                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                            What we collect:
                                                        </DetailsTitle>
                                                        <DetailsList>
                                                            <li>Essential cookies for authentication & security</li>
                                                            <li>Analytics to improve platform performance</li>
                                                            <li>User preferences and settings</li>
                                                            <li>Wallet connection data (encrypted)</li>
                                                        </DetailsList>
                                                        <NoticeBox>
                                                            <svg fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                            <p>
                                                                Your data is encrypted and never sold to third
                                                                parties.{' '}
                                                                <Link href="/legal?type=policy" target="_blank">
                                                                    <InlineLink as="span">Full Privacy Policy</InlineLink>
                                                                </Link>
                                                            </p>
                                                        </NoticeBox>
                                                    </DetailsCard>
                                                </DetailsMotion>
                                            </TextColumn>
                                        </HeroRow>
                                    </MainColumn>

                                    <ActionsColumn>
                                        <AcceptButton
                                            type="button"
                                            onClick={handleAccept}
                                            disabled={!allAccepted}
                                            $enabled={allAccepted}
                                        >
                                            {allAccepted ? (
                                                <AcceptContent>
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2.5}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    Accept All
                                                </AcceptContent>
                                            ) : (
                                                'Select All'
                                            )}
                                        </AcceptButton>

                                        <DetailsToggle
                                            type="button"
                                            onClick={() => setShowDetails((prev) => !prev)}
                                        >
                                            {showDetails ? 'Hide Details' : 'View Details'}
                                        </DetailsToggle>
                                    </ActionsColumn>
                                </ContentLayout>

                                <ProgressRow>
                                    <ProgressTrack>
                                        <ProgressBar $progress={acceptedCount * 50} />
                                    </ProgressTrack>
                                    <ProgressText>{acceptedCount}/2</ProgressText>
                                </ProgressRow>

                                <SecureBadge>
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>Secured by FOMO Platform | GDPR Compliant</span>
                                </SecureBadge>
                            </BannerContent>
                        </BannerCard>
                    </BannerMaxWidth>
                </BannerRoot>
            )}

        </>
    );
};

export default CookieConsent;
