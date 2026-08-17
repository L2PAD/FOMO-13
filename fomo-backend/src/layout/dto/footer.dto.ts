export interface Link {
    name:string
    url:string
}

export interface SocialItem extends Link{
    icon:any
}

export interface LegalItem {
    name:string
    string:string
}

export class Social {
    email:string
    twitter:string
    telegramRu:string
    telegramEn:string
    youtube:string
}

export class Legal {
    policy:string
    terms:string
    disclaimer:string
}

export class FooterApps {
    telegramMiniApp:string
    appStore:string
    googlePlay:string
    fomoIntel:string
    fomoAi:string
    whitepaper:string
    lightpaper:string
}

export class FooterDto {
    social:Social
    legal:Legal
    apps?:FooterApps
}

