import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
    timestamps: true,
})
export class AuthChallenge extends Document {
    @Prop({ required: true, index: true })
    address: string

    @Prop({ required: true, unique: true })
    nonce: string

    @Prop({ default: false })
    used: boolean

    @Prop({
        expires: 300,
    })
    createdAt: Date
}

export const AuthChallengeSchema =
    SchemaFactory.createForClass(AuthChallenge)
