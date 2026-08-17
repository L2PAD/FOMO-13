import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './models/banner.model';
import { BannerDto } from './dto/banner.dto';
import { FilesService } from '../files/files.service';

@Injectable()
export class BannerService {
    constructor(
        @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
        private readonly filesService : FilesService
    ){}

    async getBanners(page:string) : Promise<Array<Banner>> {
        const list : Array<Banner> = await this.bannerModel.find(page !== 'all' ? {page} : {})

        return list.reverse()
    }
    
    async createBanner(data:BannerDto) : Promise<Banner> {
        const file = data.img ? await this.filesService.writeFile(data.img) : ''

        return this.bannerModel.create({...data,img:file})
    }

    async updateBanner(id:string,data:BannerDto) : Promise<Banner> {
        const file = data.img && typeof data.img !== 'string' ? await this.filesService.writeFile(data.img) : '' 

        const updatedBanner : BannerDto = {
            title:data.title,
            description:data.description,
            link:data.link,
            date:data.date,
            timeStart:data.timeStart,
            img:data.img
        }

        if(file) updatedBanner.img = file

        return this.bannerModel.findByIdAndUpdate(id,updatedBanner)
    }

    async deleteBanner(id:string) : Promise<Banner> {
        const banner : Banner = await this.bannerModel.findByIdAndDelete(id)

        banner.img && await this.filesService.removeFile(banner.img)

        return banner 
    }
}
