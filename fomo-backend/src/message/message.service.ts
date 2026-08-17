import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './models/message.model';
import mongoose, { Model, mongo } from 'mongoose';
import { MessageDto } from './dto/message.dto';
import { User, UserDocument } from 'src/user/user.model';
import { Chat, ChatDocument } from 'src/chat/models/chat.model';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
        private readonly filesService: FilesService
    ){}
    
    async getNewMessages(id: string): Promise<Array<Message>> {
        const messages = await this.messageModel.find({
            to:new mongoose.Types.ObjectId(id),
            isNew:true
        })
    
        return messages;
    }

    async getAllMessages(id: string): Promise<Array<Message>> {
        const messages = await this.messageModel.aggregate([
            {
                $match: {
                    to: new mongoose.Types.ObjectId(id)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { senderId: '$from' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$senderId'] } } },
                        {
                            $project: {
                                _id: 1,
                                role: 1,
                                username: 1,
                                photo: 1,
                                twitterData: 1
                            }
                        }
                    ],
                    as: 'sender'
                }
            },
            {
                $unwind: {
                    path: '$sender',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'sender.role': { $in: ['admin', 'moderator'] }
                }
            }
        ]);
    
        return messages.reverse();
    }

    async getCurrentUserMessages(userId: string,recipientId:string): Promise<Array<Message>> {
        const messages = await this.messageModel.aggregate([
            {
                $match: {
                    to: new mongoose.Types.ObjectId(userId),
                    from: new mongoose.Types.ObjectId(recipientId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: {
                    path: '$sender',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
    
        return messages.reverse();
    }

    async getCurrentChatMessages(
        chatId: string,
        userId: string,
        isStaff = false,
        limit = 20,
        skip = 0
    ): Promise<{ messages: Array<Message>; total: number; hasMore: boolean }> {
        let hasStaffAccess = isStaff;
        if (!hasStaffAccess && mongoose.Types.ObjectId.isValid(userId)) {
            const requester = await this.userModel.findById(userId).select('role');
            const roles = Array.isArray(requester?.role) ? requester.role : [];
            hasStaffAccess = roles.includes('admin') || roles.includes('moderator');
        }

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            throw new NotFoundException('Chat not found');
        }

        if (!hasStaffAccess) {
            const chat = await this.chatModel.findOne({
                _id: new mongoose.Types.ObjectId(chatId),
                participants: new mongoose.Types.ObjectId(userId)
            }).select('_id');

            if (!chat) {
                throw new NotFoundException('Chat not found');
            }
        }

        const matchStage = {
            chatId: new mongoose.Types.ObjectId(chatId),
        };

        // Получаем общее количество сообщений
        const total = await this.messageModel.countDocuments(matchStage);

        const messages = await this.messageModel.aggregate([
            {
                $match: matchStage
            },
            {
                $sort: { date: -1 } // Сортировка от новых к старым
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: {
                    path: '$sender',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: this.messageModel.collection.name,
                    localField: 'replyTo',
                    foreignField: '_id',
                    as: 'replyToMessage'
                }
            },
            {
                $unwind: {
                    path: '$replyToMessage',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { replySenderId: '$replyToMessage.from' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$replySenderId'] } } },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                photo: 1,
                                twitterData: 1
                            }
                        }
                    ],
                    as: 'replyToMessage.sender'
                }
            },
            {
                $unwind: {
                    path: '$replyToMessage.sender',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { date: 1 } // Возвращаем от старых к новым для отображения
            }
        ]);
    
        return {
            messages,
            total,
            hasMore: skip + limit < total
        };
    }

    async createMessage (message:MessageDto, isStaff = false) : Promise<Message> {
        if (!message.message?.trim() && (!message.attachments || message.attachments.length === 0)) {
            throw new NotFoundException('Message text or attachments required');
        }

        if (message.chatId && mongoose.Types.ObjectId.isValid(message.chatId)) {
            const chat = await this.chatModel.findById(message.chatId).select('participants');
            if (!chat) {
                throw new NotFoundException('Chat not found');
            }

            const senderId = new mongoose.Types.ObjectId(message.from);
            const isParticipant = chat.participants.some(
                (participant) => String(participant) === String(senderId)
            );

            if (!isStaff && !isParticipant) {
                throw new NotFoundException('Chat not found');
            }
        }

        // Проверяем, не заблокировал ли получатель отправителя
        const recipient = await this.userModel.findById(message.to).select('blockedUsers');
        if (recipient && recipient.blockedUsers.some(id => id.toString() === message.from)) {
            throw new HttpException('You are blocked by this user', HttpStatus.FORBIDDEN);
        }

        // Проверяем, не заблокировал ли отправитель получателя
        const sender = await this.userModel.findById(message.from).select('blockedUsers');
        if (sender && sender.blockedUsers.some(id => id.toString() === message.to)) {
            throw new HttpException('You have blocked this user', HttpStatus.FORBIDDEN);
        }

        return this.messageModel.create({
            ...message,
            message: message.message || '',
            from:new mongoose.Types.ObjectId(message.from),
            to:new mongoose.Types.ObjectId(message.to),
            chatId:message.chatId ? new mongoose.Types.ObjectId(message.chatId) : new mongoose.Types.ObjectId(),
            replyTo: message.replyTo ? new mongoose.Types.ObjectId(message.replyTo) : undefined,
        })  
    }

    async uploadMessageFile(file: { buffer: Buffer; originalName: string }) {
        const fileName = await this.filesService.writeFile({
            buffer: file.buffer,
            originalName: file.originalName,
        });

        return {
            url: fileName,
            name: file.originalName,
        };
    }

    async getMessageById(messageId: string): Promise<Message | null> {
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return null;
        }

        const items = await this.messageModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(messageId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'from',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: {
                    path: '$sender',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: this.messageModel.collection.name,
                    localField: 'replyTo',
                    foreignField: '_id',
                    as: 'replyToMessage'
                }
            },
            {
                $unwind: {
                    path: '$replyToMessage',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'replyToMessage.from',
                    foreignField: '_id',
                    as: 'replyToMessage.sender'
                }
            },
            {
                $unwind: {
                    path: '$replyToMessage.sender',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);

        return items?.[0] || null;
    }

    async updateMessages(userId:string,chatId:string) : Promise<any> {
        return this.messageModel.updateMany(
            {
                chatId:new mongoose.Types.ObjectId(chatId),
                to:new mongoose.Types.ObjectId(userId),
                isNew:true
            },
            {
                isNew:false
            }
        )
    }

    async addReport(messageId: string, userId: string): Promise<MessageDocument> {
        const id: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);
        const message = await this.messageModel.findById(messageId);

        if (!message) {
            throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
        }

        if (message.reports.includes(id)) {
            throw new HttpException('The report has already been submitted by this user', HttpStatus.NOT_FOUND);
        }

        message.reports.push(id);

        return message.save();
    }

    async getReportedMessages(): Promise<Array<any>> {
        const messages = await this.messageModel.aggregate([
            {
                $match: {
                    reports: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: "from",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            {
                $lookup: {
                    from: this.userModel.collection.name,
                    localField: "to",
                    foreignField: "_id",
                    as: "recipient"
                }
            },
            {
                $addFields: {
                    reportsCount: {
                        $cond: {
                            if: { $isArray: "$reports" },
                            then: { $size: "$reports" },
                            else: 0
                        }
                    }
                }
            },
            {
                $match: {
                    reportsCount: { $gt: 0 }
                }
            },
            {
                $sort: { reportsCount: -1 }
            },
            {
                $limit: 20
            }
        ]);

        return messages;
    }
}
