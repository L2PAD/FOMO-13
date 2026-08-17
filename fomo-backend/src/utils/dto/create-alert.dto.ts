
export type NotificationsTypes = 'telegram' | 'email'

export class CreateAlertDto {
    projectId:string 
    userId:string 
    name:string
    sensitivity:Array<number>
    notificationTypes:Array<NotificationsTypes>
}