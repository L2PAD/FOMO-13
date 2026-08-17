import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { About,AboutDocument } from './models/about.model';
import { FilesService } from 'src/files/files.service';
import { Member,MemberDocument } from './models/member.model';
import { Partner,PartnerDocument } from './models/partner.model';
import { TeamItem,TeamItemDocument } from './models/teamItem.model';
import { AddMemberDto } from './dto/add-member.dto';
import { EditMemberDto } from './dto/edit-member.dto';
import { MemberDto } from './dto/member.dto';
import { AboutDto } from './dto/about.dto';
import { EditAboutDto } from './dto/edit-about.dto';
import { PartnerDto } from './dto/partner.dto';
import { AddPartnerDto } from './dto/add-partner.dto';
import { EditPartnerDto } from './dto/edit-partner.dto';

@Injectable()
export class AboutService {
    constructor(
        @InjectModel(About.name) private aboutModel: Model<AboutDocument>,
        @InjectModel(Member.name) private memberModel: Model<MemberDocument>,
        @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,
        @InjectModel(TeamItem.name) private teamItemModel: Model<TeamItemDocument>,
        private readonly filesService : FilesService
    ){}

    async getAbout() : Promise<AboutDto> {
        const about : AboutDto | any = await this.aboutModel.aggregate([
            {
                $match:{_id: new mongoose.Types.ObjectId('64872715c15a9cce3ebcccbb')}
            },
            {
                $lookup:{
                    from: this.memberModel.collection.name, 
                    localField: "members", 
                    foreignField: "_id", 
                    as: "members"
                }
            },
            {
                $lookup:{
                    from: this.partnerModel.collection.name, 
                    localField: "partners", 
                    foreignField: "_id", 
                    as: "partners"
                }
            },
            {
                $lookup:{
                    from: this.teamItemModel.collection.name, 
                    localField: "team", 
                    foreignField: "_id", 
                    as: "team"
                }
            },
        ])

        return about
    }

    async editAbout(text:string) : Promise<EditAboutDto>{
        const about  = await this.aboutModel.findOne()
        
        about.text = text

        const editedAbout : EditAboutDto = await about.save()

        return editedAbout 
    }

    async addMember(member:AddMemberDto) : Promise<MemberDto> {
        const avatarLink : string = await this.filesService.writeFile(member.avatar)

        const newMember : MemberDto = {...member,avatar:avatarLink}

        const createdMember = await this.memberModel.create(newMember)
        
        const about = await this.aboutModel.findOne()

        about.members = [...about.members,new mongoose.Types.ObjectId(createdMember._id)]

        await about.save()

        return {...newMember,_id:createdMember._id}
    }

    async editMember(id:string,member:EditMemberDto) : Promise<MemberDto> {
        if(typeof member.avatar !== 'string'){
            const avatarLink : string = member.avatar && await this.filesService.writeFile(member.avatar)

            member.oldAvatar && await this.filesService.removeFile(member.oldAvatar)
           
            return await this.memberModel.findOneAndUpdate({_id:id},{$set:{...member,avatar:avatarLink}})
        }

        return await this.memberModel.findOneAndUpdate({_id:id},{$set:{...member}})
    }

    async deleteMember(memberId:string) : Promise<MemberDto> {
        const deletedMember : any = await this.memberModel.findByIdAndDelete(memberId)

        deletedMember.avatar && await this.filesService.removeFile(deletedMember.avatar)

        const about = await this.aboutModel.findOne()

        const updatedMembers : Array<mongoose.Types.ObjectId> = 
        about.members.filter((member : mongoose.Types.ObjectId) => String(member) !== memberId)

        about.members = updatedMembers

        await about.save()

        return deletedMember
    }

    async addTeamItem(teamItem:AddMemberDto) : Promise<MemberDto> {
        const avatarLink : string = await this.filesService.writeFile(teamItem.avatar)

        const newTeamItem : MemberDto = {...teamItem,avatar:avatarLink}

        const createdTeamItem = await this.teamItemModel.create(newTeamItem)
        
        const about = await this.aboutModel.findOne()

        about.team = [...about.team,new mongoose.Types.ObjectId(createdTeamItem._id)]

        await about.save()

        return {...newTeamItem,_id:createdTeamItem._id}
    }

    async editTeamItem(id:string,teamItem:EditMemberDto) : Promise<MemberDto> {
        if(typeof teamItem.avatar !== 'string'){
            const avatarLink : string = teamItem.avatar && await this.filesService.writeFile(teamItem.avatar)

            teamItem.oldAvatar && await this.filesService.removeFile(teamItem.oldAvatar)
           
            return await this.teamItemModel.findOneAndUpdate({_id:id},{$set:{...teamItem,avatar:avatarLink}})
        }

        return await this.teamItemModel.findOneAndUpdate({_id:id},{$set:{...teamItem}})
    }

    async deleteTeamItem(teamItemId:string) : Promise<MemberDto> {
        const deletedteamItem : MemberDto = await this.teamItemModel.findByIdAndDelete(teamItemId)

        deletedteamItem.avatar && await this.filesService.removeFile(deletedteamItem.avatar)

        const about = await this.aboutModel.findOne()

        const updatedTeamItems : Array<mongoose.Types.ObjectId> = 
        about.team.filter((member : mongoose.Types.ObjectId) => String(member) !== teamItemId)

        about.team = updatedTeamItems

        await about.save()

        return deletedteamItem
    }

    async addPartner(partner:AddPartnerDto) : Promise<PartnerDto> { 
        const imgLink : string = partner.img && await this.filesService.writeFile(partner.img)

        const newPartner : PartnerDto = await this.partnerModel.create({...partner,img:imgLink})

        const about = await this.aboutModel.findOne()

        about.partners = [...about.partners,new mongoose.Types.ObjectId(newPartner._id)]

        await about.save()

        return newPartner
    }

    async editPartner(id:string,partner:EditPartnerDto) : Promise<PartnerDto> {
        if(typeof partner.img !== 'string'){
            const imgLink : string = partner.img && await this.filesService.writeFile(partner.img)

            partner.oldImg && await this.filesService.removeFile(partner.oldImg)

            return await this.partnerModel.findOneAndUpdate({_id:id},{$set:{...partner,img:imgLink}})
        }

        return await this.partnerModel.findOneAndUpdate({_id:id},{$set:{...partner}})
    }

    async deletePartner(partnerId:string) : Promise<PartnerDto> {
        const deletedPartner : PartnerDto = await this.partnerModel.findByIdAndDelete(partnerId)

        deletedPartner.img && await this.filesService.removeFile(deletedPartner.img)

        const about = await this.aboutModel.findOne()

        const updatedPartners : Array<mongoose.Types.ObjectId> = 
        about.partners.filter((partner : mongoose.Types.ObjectId) => String(partner) !== partnerId)

        about.partners = updatedPartners

        return deletedPartner
    }
}
