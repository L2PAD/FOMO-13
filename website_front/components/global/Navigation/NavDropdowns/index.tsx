import React, { useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import DropdownIcon from '../../Icons/nav/DropdownIcon'
import DropdownLine from '../../Icons/nav/DropdownLine'
import { LayoutContext } from '../../Layout'
import { IFomoNotification, STORAGE_UPDATES_KEY } from '../../NavBar'
import { CoreNavList, CryptoNavList, INavItem, UtilityNavList } from '../../../../staticContent/nav'
import { Dropdown, DropdownButton, DropdownContent, NavItem, NavLink, RotatingDropdownIconWrapper, SubNav, Wrapper } from './styles'
import PromoPills from './PromoPills'
import { useTranslation } from "i18n"

export type NavTab = 'crypto' | 'utility' | 'core' | 'explore'

const getStoredSeenIds = (): string[] => {
    if (typeof window === 'undefined') return []

    try {
        const value = window.localStorage.getItem(STORAGE_UPDATES_KEY)
        const parsed = value ? JSON.parse(value) : []

        return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
        return []
    }
}

const renderNavList = (
    isVisible: boolean,
    list: INavItem[],
    activeSub: string | null,
    setActiveSub: (value: string) => void,
    translateText: (text: string) => string,
    openInNewTab = false,
) => {
    const renderItemLink = (item: INavItem) => {
        const href = item.status ? item.link : '#'

        if (openInNewTab || item.external) {
            return (
                <NavLink
                    href={href}
                    disabled={!item.status}
                    target={item.status ? '_blank' : undefined}
                    rel={item.status ? 'noreferrer noopener' : undefined}
                >
                    {translateText(item.name)}
                </NavLink>
            )
        }

        return (
            <Link href={href} passHref legacyBehavior>
                <NavLink disabled={!item.status}>{translateText(item.name)}</NavLink>
            </Link>
        )
    }

    return list.map((item, index) => {
        const hasChildren = item.links && item.links.length > 0
        const isSubOpen = activeSub === item.name

        return (
            <NavItem
                key={`${item.name}-${index}`}
                disabled={!item.status}
                className={isVisible ? 'visible' : ''}
                style={{ transitionDelay: `${index * 0.05}s` }}
                onClick={() => hasChildren && setActiveSub(item.name)}
            >
                {item.link ? (
                    renderItemLink(item)
                ) : (
                    <NavLink
                        disabled={!item.status}
                        className={hasChildren ? 'has-children' : ''}
                        onClick={() =>
                            hasChildren
                                ? setActiveSub(isSubOpen ? '' : item.name)
                                : undefined
                        }
                    >
                        {translateText(item.name)}
                        {hasChildren && <RotatingDropdownIconWrapper className='sub-icon' isOpen={activeSub === item.name}>
                            <DropdownIcon />
                        </RotatingDropdownIconWrapper>}
                    </NavLink>
                )}

                {hasChildren && (
                    <SubNav isVisible={isSubOpen}>
                        {item.links!.map((sub, subIndex) => (
                            <NavItem
                                key={`${sub.name}-${subIndex}`}
                                disabled={!sub.status}
                                className={isSubOpen && isVisible ? 'visible' : ''}
                                style={{ transitionDelay: `${subIndex * 0.05}s` }}
                            >
                                {renderItemLink(sub)}
                            </NavItem>
                        ))}
                    </SubNav>
                )}
            </NavItem>
        )
    })
}

const NavDropdowns = () => {
    const router = useRouter();
    const { t, translateText } = useTranslation()
    const { layout } = useContext(LayoutContext)
    const [activeTab, setActiveTab] = useState<NavTab | null>(null);
    const [activeDropdown, setActiveDropdown] =
        useState<NavTab | null>(null)
    const [activeSubNav, setActiveSubNav] = useState<string | null>(null)
    const [seenIds, setSeenIds] = useState<string[]>([])
    const [isSeenIdsHydrated, setIsSeenIdsHydrated] = useState(false)

    const navRef = useRef<HTMLDivElement | null>(null)

    const toggle = (key: NavTab) => {
        setActiveSubNav(null)
        setActiveDropdown((prev) => (prev === key ? null : key))
    }

    const toggleSubItem = (key: string) =>
        setActiveSubNav(key === activeSubNav ? '' : key)

    const isSectionUpdated = (section: NavTab) => {
        if (!isSeenIdsHydrated || !layout?.updates) return false;

        return layout.updates.some((update: IFomoNotification) =>
            update.page.toLowerCase() === section &&
            !seenIds.includes(String(update._id))
        );
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const syncSeenIds = () => {
            setSeenIds(getStoredSeenIds())
            setIsSeenIdsHydrated(true)
        }

        syncSeenIds()
        window.addEventListener('storage', syncSeenIds)
        window.addEventListener('fomo-updates-seen-change', syncSeenIds)

        return () => {
            window.removeEventListener('storage', syncSeenIds)
            window.removeEventListener('fomo-updates-seen-change', syncSeenIds)
        }
    }, []);

    useEffect(() => {
        const path: NavTab | '' = router.asPath.split('/')[1] as NavTab | ''

        if (path === '') {
            setActiveTab('crypto')
        } else {
            setActiveTab(path)
        }
    }, [router.asPath])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                navRef.current &&
                !navRef.current.contains(event.target as Node)
            ) {
                setActiveDropdown(null)
                setActiveSubNav(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!isSeenIdsHydrated || !activeTab || !layout?.updates) return;

        const toMark = layout.updates
            .filter((u: IFomoNotification) => u.page.toLowerCase() === activeTab)
            .map((u: IFomoNotification) => String(u._id))
            .filter((id: string) => !seenIds.includes(id));

        if (toMark.length === 0) return;

        const nextSeenIds = Array.from(new Set([...seenIds, ...toMark]));

        window.localStorage.setItem(
            STORAGE_UPDATES_KEY,
            JSON.stringify(nextSeenIds)
        );
        window.dispatchEvent(new Event('fomo-updates-seen-change'));
        setSeenIds(nextSeenIds);
    }, [activeTab, isSeenIdsHydrated, layout?.updates, seenIds]);

    return (
        <Wrapper ref={navRef}>
            <Dropdown isActive={activeDropdown === 'crypto'}>
                {isSectionUpdated('crypto') && <div className="update-indicator" />}
                <DropdownButton
                    className={activeTab === 'crypto' ? 'active' : ''}
                    isOpen={activeDropdown === 'crypto'}
                    onClick={() => toggle('crypto')}
                >
                    <span>{t('navigation.sections.crypto')}</span>
                    <RotatingDropdownIconWrapper isOpen={activeDropdown === 'crypto'}>
                        <DropdownIcon />
                    </RotatingDropdownIconWrapper>
                </DropdownButton>

                <DropdownContent isVisible={activeDropdown === 'crypto'}>
                    {renderNavList(activeDropdown === 'crypto', CryptoNavList, activeSubNav, toggleSubItem, translateText)}
                </DropdownContent>

            </Dropdown>

            <DropdownLine />

            <Dropdown isActive={activeDropdown === 'utility'}>
                {isSectionUpdated('utility') && <div className="update-indicator" />}
                <DropdownButton
                    className={activeTab === 'utility' ? 'active' : ''}
                    isOpen={activeDropdown === 'utility'}
                    onClick={() => toggle('utility')}
                >
                    <span>{t('navigation.sections.utility')}</span>
                    <RotatingDropdownIconWrapper isOpen={activeDropdown === 'utility'}>
                        <DropdownIcon />
                    </RotatingDropdownIconWrapper>
                </DropdownButton>

                <DropdownContent isVisible={activeDropdown === 'utility'}>
                    {renderNavList(activeDropdown === 'utility', UtilityNavList, activeSubNav, toggleSubItem, translateText)}
                </DropdownContent>
            </Dropdown>

            <DropdownLine />

            <Dropdown isActive={activeDropdown === 'core'}>
                {isSectionUpdated('core') && <div className="update-indicator" />}
                <DropdownButton
                    className={activeTab === 'core' ? 'active' : ''}
                    isOpen={activeDropdown === 'core'}
                    onClick={() => toggle('core')}
                >
                    <span>{t('navigation.sections.core')}</span>
                    <RotatingDropdownIconWrapper isOpen={activeDropdown === 'core'}>
                        <DropdownIcon />
                    </RotatingDropdownIconWrapper>
                </DropdownButton>

                <DropdownContent isVisible={activeDropdown === 'core'}>
                    {renderNavList(activeDropdown === 'core', CoreNavList, activeSubNav, toggleSubItem, translateText)}
                </DropdownContent>
            </Dropdown>

            <DropdownLine />

            <Dropdown isActive={false}>
                <PromoPills />
            </Dropdown>
        </Wrapper>
    )
}

export default NavDropdowns
