import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Chat, ChatDocument } from './models/chat.model';
import { User, UserDocument } from 'src/user/user.model';
import { Message, MessageDocument } from 'src/message/models/message.model';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {
    // this.remove()
  }

  async remove() {
    await this.chatModel.deleteMany({})
  }

  async createChat(participants: string[], owner: string): Promise<Chat> {
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      throw new BadRequestException('Invalid chat owner id');
    }

    const sanitizedParticipants = Array.from(
      new Set(
        participants.filter((id) => mongoose.Types.ObjectId.isValid(id))
      )
    );

    if (!sanitizedParticipants.includes(owner)) {
      sanitizedParticipants.push(owner);
    }

    const sortedParticipants = [...sanitizedParticipants].sort();
    const participantsHash = sortedParticipants.join('_');

    const isOwnerInParticipants = sortedParticipants.some(id => id === owner);
    if (!isOwnerInParticipants) {
      throw new BadRequestException('Chat owner must be one of the participants');
    }

    const isOnlyOwner = sortedParticipants.every(id => id === owner);
    if (isOnlyOwner) {
      throw new BadRequestException('Chat must have at least one other participant');
    }

    try {
      const existingChat = await this.chatModel.findOne({
        participantsHash
      }).exec();

      if (existingChat) {
        return existingChat;
      }

      const newChat = new this.chatModel({
        participants: sortedParticipants.map((item) => new mongoose.Types.ObjectId(item)),
        owner: new mongoose.Types.ObjectId(owner),
        created: new Date(),
        participantsHash
      });

      return await newChat.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        const existingChat = await this.chatModel.findOne({
          participantsHash
        }).exec();

        if (existingChat) {
          return existingChat;
        }
      }

      throw error;
    }
  }

  async getChats(userId: string): Promise<Array<Chat>> {
    const items: Array<any> = await this.chatModel.aggregate([
      {
        $match: {
          participants: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: 'participants',
          foreignField: '_id',
          as: 'participantsData',
        },
      },
      {
        $match: {
          $expr: { $gte: [{ $size: "$participantsData" }, 2] }
        }
      },
      {
        $lookup: {
          from: this.messageModel.collection.name,
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages',
        },
      },
      {
        $project: {
          pinnedUsers: 1,
          created: 1,
          participantsData: {
            _id: 1,
            role: 1,
            wallet: 1,
            discordData: 1,
            telegramData: 1,
            twitterData: 1,
            photo: 1,
            username: 1,
            rating: 1,
            redFlags: 1,
            onlineDate: 1,
            activityXP: 1,
            verificationStatus: 1,
            createDate: 1,
            rank: 1,
            regionData: 1,
          },
          messages: {
            $map: {
              input: '$messages',
              as: 'msg',
              in: {
                _id: '$$msg._id',
                message: '$$msg.message',
                title: '$$msg.title',
                from: '$$msg.from',
                to: '$$msg.to',
                isNew: '$$msg.isNew',
                date: '$$msg.date',
              },
            },
          },
        },
      },
    ]);

    const validChats = items.filter(item => {
      if (!item.participantsData || item.participantsData.length < 2) {
        return false;
      }

      const otherUsers = item.participantsData.filter(
        (user: any) => String(user._id) !== userId
      );

      return otherUsers.length > 0;
    });

    if (validChats.length < items.length) {
      const invalidChatIds = items
        .filter(item => !validChats.includes(item))
        .map(item => item._id);

      if (invalidChatIds.length > 0) {
        await this.chatModel.deleteMany({
          _id: { $in: invalidChatIds }
        });

        await this.messageModel.deleteMany({
          chatId: { $in: invalidChatIds }
        });

        console.warn(`Удалено ${invalidChatIds.length} чатов с менее чем 2 участниками`);
      }
    }

    const chats: Array<any> = validChats.map((item: any) => {
      const userData: any = item.participantsData.find((user: any) => String(user._id) !== userId);
      const lastMessage: any | undefined = item.messages.length > 0 ?
        item.messages[item.messages.length - 1] :
        undefined;

      return {
        ...item,
        user: userData,
        lastMessage,
        isPinned: item.pinnedUsers.some((id: mongoose.Types.ObjectId) => String(id) === userId)
      };
    });

    return chats;
  }

  async getChat(chatId: string, userId: string, isStaff = false): Promise<Chat> {
    const matchStage: any = {
      _id: new mongoose.Types.ObjectId(chatId),
    };

    if (!isStaff) {
      matchStage.participants = new mongoose.Types.ObjectId(userId);
    }

    const items: Array<any> = await this.chatModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: 'participants',
          foreignField: '_id',
          as: 'participantsData',
        },
      },
      {
        $lookup: {
          from: this.messageModel.collection.name,
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages',
        },
      },
      {
        $project: {
          created: 1,
          participantsData: {
            _id: 1,
            role: 1,
            wallet: 1,
            discordData: 1,
            telegramData: 1,
            twitterData: 1,
            photo: 1,
            username: 1,
            rating: 1,
            redFlags: 1,
            activityXP: 1,
            verificationStatus: 1,
            createDate: 1,
            rank: 1,
            regionData: 1,
          },
          messages: {
            $map: {
              input: '$messages',
              as: 'msg',
              in: {
                _id: '$$msg._id',
                message: '$$msg.text',
                title: '$$msg.title',
                from: '$$msg.from',
                to: '$$msg.to',
                isNew: '$$msg.isNew',
                date: '$$msg.createdAt',
              },
            },
          },
        },
      },
    ]);

    if (!items?.length) throw new HttpException('Chat not founded', HttpStatus.NOT_FOUND)

    return items[0]
  }

  async canAccessChat(chatId: string, userId: string, isStaff = false): Promise<boolean> {
    if (isStaff) return true;
    if (!mongoose.Types.ObjectId.isValid(chatId)) return false;

    const chat = await this.chatModel.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      participants: new mongoose.Types.ObjectId(userId),
    }).select('_id');

    return !!chat;
  }

  async pinChat(chatId: string, userId: string): Promise<Chat> {
    const userIdMongo = new mongoose.Types.ObjectId(userId);

    const chat = await this.chatModel.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      participants: { $in: [userIdMongo] }
    });

    if (!chat) throw new HttpException('Chat not founded', HttpStatus.NOT_FOUND);

    const isPinned = chat.pinnedUsers.includes(userIdMongo);
    if (isPinned) {
      throw new HttpException('Chat already pinned', HttpStatus.BAD_REQUEST);
    }

    await this.chatModel.updateOne(
      { _id: chat._id },
      { $addToSet: { pinnedUsers: userIdMongo } }
    );

    return chat;
  }

  async unpinChat(chatId: string, userId: string): Promise<Chat> {
    const userIdMongo = new mongoose.Types.ObjectId(userId);

    const chat = await this.chatModel.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      participants: { $in: [userIdMongo] }
    });

    if (!chat) throw new HttpException('Chat not founded', HttpStatus.NOT_FOUND);

    await this.chatModel.updateOne(
      { _id: chat._id },
      { $pull: { pinnedUsers: userIdMongo } }
    );

    return chat;
  }
}
