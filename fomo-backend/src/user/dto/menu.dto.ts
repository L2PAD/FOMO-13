
type IconTypes = 
'crypto' | 'nfts' | 'earlyland'
| 'gemsLab' | 'utility' | 'dashboard'

export class NavItemDto{
    name: string;
    href?: string;
    isVisible: boolean;
    icon?: IconTypes;
    items?: NavItemDto[];
}
