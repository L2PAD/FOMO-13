export enum STATUS_LIST {
    ACTIVE = 'Active',
    UPCOMING = 'Upcoming',
    ENDED = 'Ended',
    NEW = 'New',
    BLOCKED = 'Blocked'
}

export enum USERS_STATUS_LIST {
    ACTIVE = 'Active',
    BLOCKED = 'Blocked'
}

export const StatusTabs = [
    STATUS_LIST.ACTIVE,
    STATUS_LIST.UPCOMING,
    STATUS_LIST.ENDED,
    STATUS_LIST.NEW,
]