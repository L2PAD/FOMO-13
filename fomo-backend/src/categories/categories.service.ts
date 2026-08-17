import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { Category, CategoryDocument } from './models/category.model';
import { Category, CategoryDocument } from './category.model';
import { CreateCategoryDto } from './dto/create-category.dto';

export const BUZZ_CATEGORY_TYPE = 'buzz_topic_category';

@Injectable()
export class CategoriesService implements OnModuleInit {
    private readonly logger = new Logger('CategoriesService');

    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    ) { }

    // Seed default Buzz post categories once so the composer dropdown is populated
    // and admins can immediately edit/extend them from the CRM.
    async onModuleInit(): Promise<void> {
        try {
            const count = await this.categoryModel.countDocuments({ type: BUZZ_CATEGORY_TYPE });
            if (count > 0) return;
            const defaults = ['Alpha', 'Research', 'Strategy', 'Invests', 'Analytics', 'Trade', 'News', 'Others'];
            await this.categoryModel.insertMany(
                defaults.map((name) => ({ name, type: BUZZ_CATEGORY_TYPE, page: 'buzz' }))
            );
            this.logger.log(`Seeded ${defaults.length} default Buzz categories`);
        } catch (e: any) {
            this.logger.warn(`Buzz category seed skipped: ${e?.message || e}`);
        }
    }

    async createCategory(dto: CreateCategoryDto): Promise<Category> {
        const category = new this.categoryModel({
            name: dto.name,
            type: dto.type || BUZZ_CATEGORY_TYPE,
            page: dto.page || 'buzz',
        });
        return category.save();
    }

    async getCategories(filter?: { type?: string; page?: string }): Promise<Category[]> {
        const query: any = {};
        if (filter?.type) query.type = filter.type;
        if (filter?.page) query.page = filter.page;

        return this.categoryModel.find(query).sort({ createdAt: 1 }).exec();
    }


    async deleteCategory(id: string): Promise<void> {
        const result = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Category not found');
        }
    }
}
