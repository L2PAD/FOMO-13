import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CollectionDto } from './dto/collection.dto';
import { CollectionsService } from './collections.service';
import { CollectionDocument } from './models/collection.model';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Request } from 'express';

@Controller('collections')
export class CollectionsController {

    constructor(
        private readonly collectionsService : CollectionsService
    ){}

    @Get()
    getCollections() : Promise<Array<CollectionDocument>>{
        return this.collectionsService.getCollections()
    }

    @Get('/market')
    getMarketCollections(
        @Query() query: Record<string, any>
    ): Promise<{ collections: Array<any>; total: number; page: number; limit: number }> {
        return this.collectionsService.getMarketCollections(query)
    }

    @Get('/:id')
    getCollection(@Param('id') id : string) : Promise<any>{
        return this.collectionsService.getCollection(id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post(':id/view')
    addCollectionView(@Req() req: Request, @Param('id') id: string): Promise<CollectionDocument> {
        const userId: string = req.user._id
        return this.collectionsService.addView(id, userId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('action/like/:id')
    likeCollection(@Req() req: Request, @Param('id') id: string): Promise<CollectionDocument> {
        const userId: string = req.user._id
        return this.collectionsService.addLike(id, userId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('action/dislike/:id')
    dislikeCollection(@Req() req: Request, @Param('id') id: string): Promise<CollectionDocument> {
        const userId: string = req.user._id
        return this.collectionsService.addDislike(id, userId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('action/flag/:type/:id')
    flagCollection(
        @Req() req: Request,
        @Param('id') id: string,
        @Param('type') type: 'green' | 'yellow' | 'red'
    ): Promise<CollectionDocument> {
        if (!['green', 'yellow', 'red'].includes(type)) {
            throw new BadRequestException('Invalid flag type')
        }

        const userId: string = req.user._id
        return this.collectionsService.toggleFlag(id, userId, type)
    }

    @Roles('moderator,admin')
    @UseGuards(JwtAuthGuard)
    @Post()
    createCollection(
        @Req() req : Request,
        @Body() body : CollectionDto
    ) : Promise<CollectionDocument> {
        const userId : string = req.user._id 

        return this.collectionsService.createCollection({...body,creator:userId})
    }

    @Roles('moderator,admin')
    @UseGuards(JwtAuthGuard)
    @Put('/:id')
    updateCollection(@Param('id') id : string,@Body() body : CollectionDto) : Promise<CollectionDocument> {
        return this.collectionsService.updateCollection(id,body)
    }

    @Roles('moderator,admin')
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    deleteCollection(@Param('id') id : string) : Promise<CollectionDocument> {
        return this.collectionsService.deleteCollection(id)
    }
    
    @Roles('moderator,admin')
    @UseGuards(JwtAuthGuard)
    @Patch('/:id')
    togglePinCollection(@Param('id') id : string) : Promise<CollectionDocument> {
        return this.collectionsService.toggleIsPinned(id)
    }
}
