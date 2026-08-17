import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('admin')
    async createCategory(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.createCategory(dto);
    }

    @Get()
    async getCategories(
        @Query('type') type?: string,
        @Query('page') page?: string,
    ) {
        return this.categoriesService.getCategories({ type, page });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Delete('admin/:id')
    async deleteCategory(@Param('id') id: string) {
        return this.categoriesService.deleteCategory(id);
    }
}
