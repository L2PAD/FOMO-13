
export class ParticipantsProjectDto {
    investors?:Array<string>
    team?:Array<string>
    advisors?:Array<string>
    partners?:Array<string>
}

export enum ParticipantsKeys {
    'investors',
    'team',
    'advisors',
    'partners'
}