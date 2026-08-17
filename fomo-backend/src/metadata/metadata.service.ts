import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MetadataService {
    metaData = []
    private readonly metadataReady: Promise<void>

    constructor(
    ) {
        this.metadataReady = this.getMetaData()
    }

    private async getMetaData() {
        const filePath = path.resolve(__dirname, '..', '..', 'src', 'metadata', 'sample.json');

        const json = await fs.readFile(filePath, { encoding: 'utf8' })
        const data = await JSON.parse(json)

        for (const key in data) {
            const nft = data[key]
            this.metaData.push(nft)
        }
    }

    async getNftData(id: number) {
        await this.metadataReady

        const numericId = Number(id)
        const metadataIndex = numericId - 1
        const isError =
            !Number.isInteger(numericId) ||
            metadataIndex < 0 ||
            metadataIndex >= this.metaData.length

        if (isError) throw new HttpException('Out of range', HttpStatus.NOT_FOUND)

        return this.metaData[metadataIndex]
    }

}
