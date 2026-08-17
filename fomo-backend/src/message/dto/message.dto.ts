

export class MessageDto {
    chatId?:string
    date:Date
    from:string
    to:string
    message?:string
    title:string
    attachments?: Array<{
        url: string
        name?: string
        type?: string
        size?: number
    }>
    replyTo?: string
}
