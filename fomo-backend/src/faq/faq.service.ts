import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Faq,FaqDocument } from './faq.model';
import { FaqDto } from './dto/faq.dto';

@Injectable()
export class FaqService {
    constructor(
        @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
    ){}
    async getFaqItems() : Promise<Array<FaqDto>> {
        return (await this.faqModel.find()).reverse()
    }

    async createFaqItem(faqData:FaqDto) : Promise<FaqDto>{
        return this.faqModel.create(faqData)
    }

    async updateFaqItem(id:string,faqData:FaqDto) : Promise<FaqDto>{
        return this.faqModel.findOneAndUpdate({_id:new mongoose.Types.ObjectId(id)},faqData)
    }

    async deleteFaqItem(id:string) : Promise<FaqDto>{
        return this.faqModel.findOneAndDelete({_id:new mongoose.Types.ObjectId(id)})
    }
}
