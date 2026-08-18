export interface NavigationLink {
    title: string;
    link: string;
    exact?: boolean;
    requiredRoles?: string[];
}

export interface NavigationItem {
    title: string;
    link: string;
    isDropdown: boolean;
    links: NavigationLink[];
    requiredRoles?: string[];
}

export const NavigationLinksList: NavigationItem[] = [
    {
        title: 'Статистика',
        link: '/statistics',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin', 'moderator'],
    },
    {
        title: 'AI',
        link: '/ai-chat',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin'],
    },
    {
        title: 'Data Sync',
        link: '/data-sync',
        isDropdown: false,
        links: [],
    },
    {
        title: 'Рейтинг',
        link: '/ratings',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin'],
    },
    {
        title: 'Реклама',
        link: '/advertising',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin', 'moderator'],
    },
    {
        title: 'Crypto',
        link: '/projects',
        isDropdown: true,
        links: [
            {
                title: 'Проекты',
                link: '/projects',
                exact: true,
            },
            {
                title: 'Фонды',
                link: '/projects/funds',
            },
            {
                title: 'Люди',
                link: '/projects/persons',
            },
            {
                title: 'Экосистема',
                link: '/projects/ecosystem',
            },
            {
                title: 'Очередь проверки',
                link: '/projects/fomo-v2/review-cases',
            },
            {
                title: 'Проверка вестинга',
                link: '/projects/fomo-v2/vesting-review',
            },
            {
                title: 'Launchpad',
                link: '/fomo-v2/launchpad',
                requiredRoles: ['admin'],
            },
        ],
    },
    {
        title: 'Пользователи',
        link: '/users_list',
        isDropdown: false,
        links: [],
    },
    {
        title: 'EarlyLand',
        link: '/early_land',
        isDropdown: false,
        links: [],
    },
    {
        title: 'Bazaar',
        link: '/users_list/otc',
        isDropdown: false,
        links: [],
    },
    {
        title: 'Support',
        link: '/support',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin', 'moderator'],
    },
    {
        title: 'Доступ и монетизация',
        link: '/access-monetization',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin'],
    },
    {
        title: 'Эквайринг',
        link: '/acquiring',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin'],
    },
    {
        title: 'FOMO AI',
        link: '/fomo-ai',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin'],
    },
    {
        title: 'Spaceport',
        link: '/spaceport',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin'],
    },
    {
        title: 'Buzz',
        link: '/buzz',
        isDropdown: false,
        links: [],
    },
    {
        title: 'Twitter / X',
        link: '/twitter',
        isDropdown: false,
        links: [],
        requiredRoles: ['admin', 'moderator'],
    },
    {
        title: 'Контент',
        link: '/content',
        isDropdown: false,
        links: [],
    },
    {
        title: 'Настройки',
        link: '/settings',
        isDropdown: false,
        links: [],
    },
];

export const getVisibleNavigationLinks = (role?: string | null): NavigationItem[] => {
    const normalizedRole = String(role || '').trim().toLowerCase()

    const hasRole = (requiredRoles?: string[]) => {
        if (!requiredRoles?.length) return true
        if (!normalizedRole) return false
        return requiredRoles.includes(normalizedRole)
    }

    return NavigationLinksList
        .filter((item) => hasRole(item.requiredRoles))
        .map((item) => ({
            ...item,
            links: item.links.filter((link) => hasRole(link.requiredRoles)),
        }))
}
