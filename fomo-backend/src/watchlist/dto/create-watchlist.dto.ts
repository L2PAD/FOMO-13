import mongoose from "mongoose";

export class CreateWatchlistDto {
    userId: mongoose.Types.ObjectId
    projectId: mongoose.Types.ObjectId
    page:string
}
