import { Controller, Get, Param } from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
    constructor(
        private readonly metadataService : MetadataService
    ){}

    @Get('/:id')
    getNftData(@Param('id') id : string) {
        return this.metadataService.getNftData(Number(id))
    }
}
