import { NavigationLinksList, getVisibleNavigationLinks } from './navigation_data'

describe('NavigationLinksList', () => {
    it('groups FOMO v2 links under Crypto', () => {
        const crypto = NavigationLinksList.find((item) => item.title === 'Crypto')

        expect(crypto?.links).toEqual(expect.arrayContaining([
            expect.objectContaining({ link: '/projects/fomo-v2/review-cases' }),
            expect.objectContaining({ link: '/projects/fomo-v2/vesting-review' }),
            expect.objectContaining({ link: '/projects/fomo-v2/flags' }),
            expect.objectContaining({ link: '/fomo-v2/launchpad' }),
        ]))
        expect(crypto?.links.some((link) => link.link === '/projects/fomo-v2/profile-duplicates')).toBe(false)
        expect(NavigationLinksList.some((item) => item.title === 'FOMO v2')).toBe(false)
    })

    it('does not expose the legacy NFT calendar', () => {
        const nfts = NavigationLinksList.find((item) => item.title === 'NFTs')

        expect(nfts?.links.some((link) => link.link === '/nfts/calendar')).toBe(false)
    })

    it('exposes Content as a single item placed after Spaceport', () => {
        const titles = NavigationLinksList.map((item) => item.title)
        const content = NavigationLinksList.find((item) => item.title === 'Контент')
        const crypto = NavigationLinksList.find((item) => item.title === 'Crypto')

        expect(content).toBeDefined()
        expect(content?.isDropdown).toBe(false)
        expect(content?.link).toBe('/content')
        expect(content?.links).toEqual([])
        expect(titles.indexOf('Контент')).toBeGreaterThan(titles.indexOf('Spaceport'))
        expect(crypto?.links.some((link) => link.link === '/projects/calendar')).toBe(false)
        expect(crypto?.links.some((link) => link.link === '/projects/news')).toBe(false)
    })

    it('removes Growth and moves its retained tools to their new sections', () => {
        const crypto = NavigationLinksList.find((item) => item.title === 'Crypto')
        const users = NavigationLinksList.find((item) => item.title === 'Пользователи')

        expect(NavigationLinksList.some((item) => item.title === 'Growth')).toBe(false)
        expect(crypto?.links).toEqual(expect.arrayContaining([
            expect.objectContaining({ title: 'Активности', link: '/early_land/activities' }),
        ]))
        expect(users?.links).toEqual(expect.arrayContaining([
            expect.objectContaining({ title: 'Задачи', link: '/early_land/tasks' }),
        ]))
        expect(NavigationLinksList.some((item) => item.links.some((link) => (
            link.link === '/early_land'
            || link.link.startsWith('/gems_lab')
        )))).toBe(false)
    })
})

describe('getVisibleNavigationLinks', () => {
    it('shows AI navigation only for admin', () => {
        expect(getVisibleNavigationLinks('admin').some((item) => item.link === '/ai-chat')).toBe(true)
        expect(getVisibleNavigationLinks('moderator').some((item) => item.link === '/ai-chat')).toBe(false)
        expect(getVisibleNavigationLinks(null).some((item) => item.link === '/ai-chat')).toBe(false)
    })

    it('shows Rating navigation only for admin', () => {
        const hasRating = (role: string | null) => getVisibleNavigationLinks(role)
            .some((item) => item.link === '/ratings')

        expect(hasRating('admin')).toBe(true)
        expect(hasRating('Admin')).toBe(true)
        expect(hasRating('moderator')).toBe(false)
        expect(hasRating(null)).toBe(false)
    })

    it('shows Launchpad navigation only for admin', () => {
        const hasLaunchpad = (role: string | null) => getVisibleNavigationLinks(role)
            .some((item) => item.links.some((link) => link.link === '/fomo-v2/launchpad'))

        expect(hasLaunchpad('admin')).toBe(true)
        expect(hasLaunchpad('moderator')).toBe(false)
        expect(hasLaunchpad(null)).toBe(false)
    })

    it('exposes Content as a top-level single item for admin and moderator', () => {
        const hasContent = (role: string | null) => getVisibleNavigationLinks(role)
            .some((item) => item.link === '/content' && !item.isDropdown)

        expect(hasContent('admin')).toBe(true)
        expect(hasContent('moderator')).toBe(true)
    })
})
