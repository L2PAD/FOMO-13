import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { User,UserDocument } from 'src/user/user.model';

@Injectable()
export class ExcelService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async exportUsersToExcel() : Promise<any> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'Email', key: 'email', width: 20 },
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Fomo ID', key: 'fomoId', width: 15 },
      { header: 'Telegram', key: 'telegramData', width: 15 },
      { header: 'Twitter', key: 'twitterData', width: 15 },
      { header: 'Discord', key: 'discordData', width: 15 },
      { header: 'Wallet', key: 'wallet', width: 20 },
      { header: 'Last Login', key: 'lastLogin', width: 20 },
      { header: 'Points', key: 'points', width: 15 },
    ];

    const users = await this.userModel.find().exec();

    users.forEach(user => {
      worksheet.addRow({
        email: user.email,
        username: user.username,
        fomoId: user.fomoId,
        telegramData: user.telegramData?.username, 
        twitterData: user.twitterData?.username, 
        discordData: user.discordData?.username, 
        wallet: user.wallet,
        lastLogin: user.lastLogin,
        points: user.points,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
  }
}