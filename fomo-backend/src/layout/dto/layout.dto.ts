import { HeaderDto } from "./header.dto";
import { FooterDto } from "./footer.dto";
import { BannerDto } from "./banner.dto";

export class LayoutDto {
    header:HeaderDto
    footer:FooterDto
    banner?: BannerDto
    intelUrl?: string
    promo?: any
    appStoreUrl?: string
    googlePlayUrl?: string
    updates?:any[]
}
