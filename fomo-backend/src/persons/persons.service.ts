import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { FilesService } from "src/files/files.service";
import { Connection, Model } from "mongoose";
import { CreatePersonDto } from "./dto/create-person.dto";
import { AddActionDto } from "../actions/dto/add-action.dto";
import { Person, PersonDocument } from "./person.model";
import { CommentsService } from "src/comments/comments.service";
import { ContentInfluenceService } from "src/comments/content-influence.service";
import { ActionsService } from "src/actions/actions.service";
import commentDto from "src/comments/dto/comment.dto";
import mongoose from "mongoose";
import UpdatePersonDto, { UpdatePersonByUser } from "./dto/update-person.dto";
import { User, UserDocument } from "src/user/user.model";
import { Project, ProjectDocument } from "src/projects/project.model";
import { Funds, FundsDocument } from "src/funds/funds.model";
import { RolesDto } from "src/projects/dto/update-project.dto";
import { QueryPersonDto } from "./dto/query-person.dto";
import { ActivityService } from "src/activity/activity.service";
import {
  ProjectTwitter,
  ProjectTwitterDocument,
} from "src/twitter/project-twitter.model";
import {
  SpaceportNftCountStatus,
  SpaceportNftService,
} from "src/spaceport-nft/spaceport-nft.service";
import { PersonsRatingService } from "./persons-rating.service";
import { RankResolverService } from "src/xp/rank-resolver.service";

@Injectable()
export class PersonsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Funds.name) private fundModel: Model<FundsDocument>,
    @InjectModel(ProjectTwitter.name)
    private projectTwitterModel: Model<ProjectTwitterDocument>,
    private readonly filesService: FilesService,
    private readonly commentsService: CommentsService,
    private readonly actionsService: ActionsService,
    private readonly activityService: ActivityService,
    private readonly spaceportNftService: SpaceportNftService,
    private readonly personsRatingService: PersonsRatingService,
    private readonly rankResolver: RankResolverService,
    private readonly contentInfluence: ContentInfluenceService
  ) { }

  private assertValidObjectId(id: string, entityName: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${entityName} id is invalid`);
    }
  }

  private async getAvailablePersonCollections(): Promise<string[]> {
    const collections = await this.connection.db
      .listCollections({}, { nameOnly: true })
      .toArray();
    const availableNames = new Set(collections.map((item) => item.name));

    return [this.personModel.collection.name, "people", "persons"].filter(
      (name, index, array) => array.indexOf(name) === index && availableNames.has(name)
    );
  }

  private buildBasePersonMatch(
    status: string,
    parsedQuery: QueryPersonDto,
    filter: Record<string, any>
  ): Record<string, any> {
    const andConditions: Record<string, any>[] = [];

    if (status !== "all") {
      andConditions.push({ projectStatus: status });
    }

    if (parsedQuery?.additionalStatus === "sponsored") {
      andConditions.push({ isSponsored: true });
    }

    if (parsedQuery?.additionalStatus === "eralash") {
      andConditions.push({ isEralash: true });
    }

    if (Object.keys(filter).length > 0) {
      andConditions.push(filter);
    }

    if (!andConditions.length) {
      return {};
    }

    if (andConditions.length === 1) {
      return andConditions[0];
    }

    return { $and: andConditions };
  }

  private async resolvePersonsCollectionName(
    baseMatch: Record<string, any>
  ): Promise<string> {
    const collections = await this.getAvailablePersonCollections();
    let selectedCollection = this.personModel.collection.name;
    let maxCount = -1;

    for (const collectionName of collections) {
      try {
        const count = await this.connection.db
          .collection(collectionName)
          .countDocuments(baseMatch);

        if (count > maxCount) {
          maxCount = count;
          selectedCollection = collectionName;
        }
      } catch {
        continue;
      }
    }

    return selectedCollection;
  }

  private async resolvePersonCollectionById(id: string): Promise<string> {
    this.assertValidObjectId(id, "Person");

    const collections = await this.getAvailablePersonCollections();
    const objectId = new mongoose.Types.ObjectId(id);

    for (const collectionName of collections) {
      try {
        const exists = await this.connection.db
          .collection(collectionName)
          .countDocuments({ _id: objectId }, { limit: 1 });

        if (exists > 0) {
          return collectionName;
        }
      } catch {
        continue;
      }
    }

    return this.personModel.collection.name;
  }

  private parseArrayToObjectId(
    items: string | undefined
  ): Array<mongoose.Types.ObjectId> {
    if (!items) return [];

    return items
      .split(",")
      .map((id: string) => new mongoose.Types.ObjectId(id));
  }

  private parseQueryString(query: any): QueryPersonDto {
    const parsed: any = {};

    for (const key in query) {
      const value = query[key];

      if (typeof value === "string" && value.includes(",")) {
        parsed[key] = value.split(",").map((v) => v.trim());
      } else {
        parsed[key] = value;
      }
    }

    if (parsed["regionData.region"]) {
      parsed.regionData = {
        region: parsed["regionData.region"],
      };
      delete parsed["regionData.region"];
    }

    if (parsed["red-flags"]) {
      parsed.redFlags = parsed["red-flags"];
      delete parsed["red-flags"];
    }

    parsed.limit = parsed.limit ? Number(parsed.limit) : 20;
    parsed.offset = parsed.offset ? Number(parsed.offset) : 0;

    return parsed;
  }

  private buildPersonFilter(filters: QueryPersonDto): Record<string, any> {
    const andConditions: any[] = [];

    const parseRanges = (input: string): [number, number][] => {
      return input
        .split(",")
        .filter((val) => val.includes("-"))
        .map((range) => range.split("-").map(Number) as [number, number]);
    };

    if (filters.specialization && filters.specialization.length) {
      andConditions.push({ niche: { $in: filters.specialization } });
    }

    if (filters?.regionData?.region) {
      andConditions.push({
        "regionData.region": { $in: filters?.regionData?.region },
      });
    }

    if (filters.totalInvestments && filters.totalInvestments.length) {
      const conditions = filters.totalInvestments.map((rangeStr) => {
        const [min, max] = rangeStr.split("-").map(String);
        return { totalInvested: { $gte: min, $lte: max } };
      });
      andConditions.push({ $or: conditions });
    }

    if (filters.roi && filters.roi.length) {
      const conditions = filters.roi.map((rangeStr) => {
        const [min, max] = rangeStr.split("-").map(String);
        return { athRoi: { $gte: min, $lte: max } };
      });
      andConditions.push({ $or: conditions });
    }

    if (filters.fomoScore) {
      const ranges = parseRanges(String(filters.fomoScore));

      const conditions: any[] = [];
      const hasTrue = filters.fomoScore.includes("verificationStatus=true");
      const hasFalse = filters.fomoScore.includes("verificationStatus=false");

      const includeMissingFomo = ranges.some(([min, _]) => min === 0);

      if (ranges.length) {
        conditions.push(
          ...ranges.map(([min, max]) => {
            const orCondition: any[] = [
              { fomoScore: { $gte: min, $lte: max } },
            ];
            if (min === 0 && includeMissingFomo) {
              orCondition.push({ fomoScore: { $exists: false } });
            }
            return { $or: orCondition };
          })
        );
      }

      if (conditions.length) {
        andConditions.push({ $or: conditions });
      }

      if (hasTrue && !hasFalse) {
        andConditions.push({ isSponsored: true });
      } else if (hasFalse && !hasTrue) {
        andConditions.push({ isSponsored: false });
      }
    }

    if (filters.redFlags) {
      const items = Array.isArray(filters.redFlags)
        ? filters.redFlags
        : [filters.redFlags];

      const redFlagConditions = items
        .map((val: string) => {
          if (val === "0") {
            return { redFlagsList: { $size: 0 } };
          }
          if (val.includes(">")) {
            const num = parseInt(val.substring(1), 10);
            return {
              $expr: { $gte: [{ $size: "$redFlagsList" }, num] },
            };
          }
          if (val[0] && typeof val[1] === "number") {
            const [min, max] = [val[0], val[1]];
            return {
              $expr: {
                $and: [
                  { $gte: [{ $size: "$redFlagsList" }, min] },
                  { $lte: [{ $size: "$redFlagsList" }, max] },
                ],
              },
            };
          }
          if (val.includes("-")) {
            const [min, max] = val.split("-").map(Number);
            return {
              $expr: {
                $and: [
                  { $gte: [{ $size: "$redFlagsList" }, min] },
                  { $lte: [{ $size: "$redFlagsList" }, max] },
                ],
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      if (redFlagConditions.length) {
        andConditions.push({ $or: redFlagConditions });
      }
    }

    if (filters.followers) {
      const ranges = parseRanges(String(filters.followers));

      const conditions = ranges.map(([min, max]) => {
        const rangeCondition: any = {
          followersCount: { $gte: min, $lte: max },
        };

        if (min === 0) {
          return {
            $or: [rangeCondition, { followersCount: { $exists: false } }],
          };
        }

        return rangeCondition;
      });

      if (conditions.length) andConditions.push({ $or: conditions });
    }

    return andConditions.length > 0 ? { $and: andConditions } : {};
  }

  private buildPersonsListProjection(): Record<string, 0> {
    return {
      coInvestors: 0,
      coInvestments: 0,
      portfolioCoins: 0,
      portfolioProjects: 0,
      roundsByCategory: 0,
      roundsByStage: 0,
      intelInvestorData: 0,
    };
  }

  private async getSpaceportNftStats(wallet?: string): Promise<{
    count: number | null;
    status: SpaceportNftCountStatus;
    nftAddress?: string;
  }> {
    if (!wallet) {
      return {
        count: null,
        status: "no-wallet",
      };
    }

    try {
      const result = await this.spaceportNftService.getWalletNftCount(wallet);

      return {
        count: result.count,
        status: result.status,
        nftAddress: result.nftAddress,
      };
    } catch {
      return {
        count: null,
        status: "unavailable",
      };
    }
  }

  private withPersonScores(personData: Record<string, any>): Record<string, any> {
    const scores = this.personsRatingService.calculatePersonScores(personData);
    const projectsCount = this.personsRatingService.getProjectsCount(personData);
    const roi = this.personsRatingService.getRoi(personData);

    return {
      ...personData,
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      tableRating: scores.rating,
      tableFullness: scores.fullness,
      tableRoi: roi,
      tableProjectsCount: projectsCount,
      tableSupportedProjectsCount: Math.max(
        projectsCount,
        Number(personData.portfolioCoinsCount) || 0,
      ),
      tableCountry:
        personData.country || personData.regionData?.properties?.name || "",
      tableLastUpdatedAt: new Date(),
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
    };
  }

  private async transformToPerson(userId: string): Promise<Partial<Person>> {
    this.assertValidObjectId(userId, "Fomie");

    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const {
      password,
      twoFactorSecret,
      code,
      inviter,
      invitedBoards,
      isMenuDisplay,
      userMenu,
      lastLogin,
      lastReset,
      banned,
      actions,
      events,
      is2FAEnabled,
      funds,
      claimedProjects,
      ...safeUserData
    } = user;
    const comments = await this.commentsService.getAllComments("", userId);
    const spaceportNftStats = await this.getSpaceportNftStats(user.wallet);

    const personData: any = {
      name: user.name || "",
      logo: user.photo || "",
      bio: user.bio || "",
      rating: user.rating || "",
      status: "active",
      projectStatus: "moderator",
      redFlags: user.redFlags || 0,
      redFlagsList: user.redFlagsList || [],
      greenFlagsList: user.greenFlagsList || [],
      fomoScore: user.fomoScore || 0,
      parsingTwitterData: user.parsingTwitterData || {},
      twitterScore: user.twitterScore || 0,
      previousTwitterScore: user.previousTwitterScore || 0,
      twitterScoreUpdate: user.twitterScoreUpdate || new Date(),
      regionData: user.regionData || null,
      totalInvested: user.totalInvested?.toString() || "0",
      highestRoi: user.averageRoi?.toString() || "0",
      // totalInvestments: user.totalInvestments || 0,
      leadInvestments: 0,
      likes: user.likes || [],
      dislikes: user.dislikes || [],
      createdAt: user.createDate || new Date(),
      // country: user.regionData?.country || "",
      niche: user.specialization || "",
      achievementsBlock: {
        totalInvestments: user.totalInvested?.toString() || "0",
        highestRoi: user.averageRoi?.toString() || "0",
        deals: [],
      },
      commentsCount: comments.length,
      ...safeUserData,
      spaceportNftCount: spaceportNftStats.count,
      spaceportNftCountStatus: spaceportNftStats.status,
      spaceportNftContract: spaceportNftStats.nftAddress,
    };

    // Single source of truth: rank derived from activityXP via RankResolver.
    const resolvedRank = this.rankResolver.resolveSync(Number(user.activityXP) || 0);
    personData.rank = resolvedRank.name;
    personData.xpRank = resolvedRank.name;
    personData.xpRankKey = resolvedRank.key;
    personData.xpRankProgressPct = resolvedRank.progressPct;
    personData.xpToNext = resolvedRank.xpToNext;

    // Public "Contribution & Influence" stats — sourced from the SAME canonical
    // Content Influence read-model used by Customer 360 and Top Contributors, so
    // the three surfaces never diverge. Never let it break the profile payload.
    try {
      const infl = await this.contentInfluence.getUserInfluence(userId);
      personData.contentInfluence = {
        summary: infl?.summary || null,
        periods: infl?.periods || null,
        topTopics: (infl?.topTopics || []).slice(0, 5),
      };
    } catch (e) {
      personData.contentInfluence = null;
    }

    return personData;
  }

  async getPersons(status: string, query?: QueryPersonDto) {
    const parsedQuery = this.parseQueryString(query);
    const filter = this.buildPersonFilter(parsedQuery);
    const baseMatch = this.buildBasePersonMatch(status, parsedQuery, filter);
    const collectionName = await this.resolvePersonsCollectionName(baseMatch);
    const personCollection = this.connection.db.collection(collectionName);

    const pipeline: any[] = [];

    if (Object.keys(baseMatch).length > 0) {
      pipeline.push({ $match: baseMatch });
    }

    if (parsedQuery.sortBy) {
      const [name, value] = [parsedQuery.sortBy[0], parsedQuery.sortBy[1]];

      if (name === "athRoi") {
        pipeline.push({
          $addFields: {
            athRoiNumeric: { $toDouble: "$athRoi" },
          },
        });
        pipeline.push({
          $sort: { athRoiNumeric: Number(value) },
        });
      } else {
        pipeline.push({
          $sort: { [name]: Number(value) },
        });
      }
    }

    const finalPipeline = [
      ...pipeline,
      {
        $facet: {
          items: [
            { $skip: parsedQuery.offset },
            { $limit: parsedQuery.limit },
            { $project: this.buildPersonsListProjection() },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await personCollection.aggregate(finalPipeline).toArray();

    const items = result[0]?.items || [];
    const totalCount = result[0]?.totalCount?.[0]?.count || 0;

    return { items, totalCount };
  }

  async getFomies(id: string, query?: any) {
    const parsedPerson: any = await this.transformToPerson(id);

    return {
      ...parsedPerson,
      comments: [],
    };
  }

  async getPerson(id: string, query?: any) {
    const personCollectionName = await this.resolvePersonCollectionById(id);
    const personCollection = this.connection.db.collection(personCollectionName);

    const project = await personCollection.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          projectStatus: "active",
        },
      },
      {
        $lookup: {
          from: personCollectionName,
          localField: "colleagues",
          foreignField: "_id",
          as: "colleagues",
        },
      },
      {
        $lookup: {
          from: this.projectTwitterModel.collection.name,
          localField: "_id",
          foreignField: "projectId",
          as: "projectTwitterData",
        },
      },
      {
        $unwind: {
          path: "$projectTwitterData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: this.projectModel.collection.name,
          localField: "participated",
          foreignField: "_id",
          as: "participatedProjects",
        },
      },
      {
        $unwind: {
          path: "$participatedProjects",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "participatedProjects.investors": {
            $cond: {
              if: { $isArray: "$participatedProjects.investors" },
              then: "$participatedProjects.investors",
              else: [],
            },
          },
        },
      },
      {
        $lookup: {
          from: this.fundModel.collection.name,
          let: { investorIds: "$participatedProjects.investors" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$investorIds"],
                },
              },
            },
          ],
          as: "participatedProjects.investorsDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          personData: { $first: "$$ROOT" },
          participatedProjects: {
            $push: {
              $cond: {
                if: { $gt: [{ $size: "$participatedProjects.investors" }, 0] },
                then: "$participatedProjects",
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $addFields: {
          participatedProjects: {
            $cond: {
              if: { $eq: [{ $size: "$participatedProjects" }, 0] },
              then: [],
              else: "$participatedProjects",
            },
          },
        },
      },
    ]).toArray();

    if (!project.length)
      throw new HttpException("Project not found", HttpStatus.NOT_FOUND);

    const parsedPerson = {
      ...project[0].personData,
      participated: project[0].participatedProjects.map((item: any) => {
        return { ...item, investors: item.investorsDetails };
      }),
    };

    const projectComments: Array<mongoose.Types.ObjectId> =
      parsedPerson.comments;

    const comments = await this.commentsService.getComments(projectComments);

    return {
      ...parsedPerson,
      comments,
    };
  }

  async createPerson(createPersonDto: CreatePersonDto) {
    const logo = await this.filesService.writeFile(createPersonDto.logo);

    const investors =
      createPersonDto.investors[0]?.length &&
      JSON.parse(createPersonDto.investors[0]);

    const newProject = await this.personModel.create(this.withPersonScores({
      ...createPersonDto,
      logo: logo,
      investors,
      projectStatus: "active",
      lastFunding: "",
    }));

    return newProject;
  }

  async createPersonByModerator(
    createPersonDto: CreatePersonDto,
    initiator: string,
    actionStatus?: "moderator" | "admin"
  ) {
    const actionType: string = "Publication person on Crypto page";
    const actionDate: Date = new Date();
    const logo = await this.filesService.writeFile(createPersonDto.logo);

    const investors =
      createPersonDto.investors[0]?.length &&
      JSON.parse(createPersonDto.investors[0]);

    const newProject = await this.personModel.create(this.withPersonScores({
      ...createPersonDto,
      logo: logo,
      action: actionType,
      actionDate: actionDate,
      actionInitiator: initiator,
      projectStatus: actionStatus,
      investors,
      lastFunding: "",
    }));

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      name: "Create person",
      type: actionType,
      date: actionDate,
      category: "persons",
      status: actionStatus,
      itemId: newProject._id,
    };

    await this.actionsService.addAction(action);

    return newProject;
  }

  async createPersonByUser(
    createPersonDto: CreatePersonDto,
    initiator: string
  ) {
    const actionType: string = "Publication person on Crypto page";
    const actionDate: Date = new Date();
    const actionStatus = "moderator";
    const logo = await this.filesService.writeFile(createPersonDto.logo);

    const regionData = createPersonDto.regionData
      ? JSON.parse(createPersonDto.regionData)
      : {};
    const participated: Array<mongoose.Types.ObjectId> =
      this.parseArrayToObjectId(createPersonDto.participated);

    const socialmedia = createPersonDto.socialmedia
      ? JSON.parse(createPersonDto.socialmedia)
      : [];

    const newPerson = await this.personModel.create(this.withPersonScores({
      ...createPersonDto,
      logo: logo,
      action: actionType,
      actionDate: actionDate,
      actionInitiator: initiator,
      projectStatus: actionStatus,
      participated,
      regionData,
      socialmedia,
      lastFunding: "",
    }));

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      name: "Create person",
      type: actionType,
      date: actionDate,
      category: "persons",
      status: actionStatus,
      itemId: newPerson._id,
    };

    await this.userModel.findByIdAndUpdate(initiator, {
      $inc: { personLimit: -1 },
    });

    await this.actionsService.addAction(action);

    return newPerson;
  }

  async editPersonByUser(
    id: string,
    updatePersonDto: UpdatePersonByUser,
    initiator: string
  ) {
    const updatedProject = await this.personModel.findById(id);

    // const participated: Array<mongoose.Types.ObjectId> =
    //   updatePersonDto.participated
    //     ? updatePersonDto.participated.map(
    //         (item: string) => new mongoose.Types.ObjectId(item)
    //       )
    //     : [];

    // const colleagues: Array<mongoose.Types.ObjectId> =
    //   updatePersonDto.colleagues
    //     ? updatePersonDto.colleagues.map(
    //         (item: string) => new mongoose.Types.ObjectId(item)
    //       )
    //     : [];

    const newProjectData = this.withPersonScores({
      ...updatedProject.toObject(),
      ...updatePersonDto,
      isDuplicate: true,
      originalEntityId: new mongoose.Types.ObjectId(id),
      _id: new mongoose.Types.ObjectId(),
      projectStatus: "moderator",
    });

    const newProject = await this.personModel.create(newProjectData);

    const actionType: string = `Update person on crypto page`;

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      itemId: new mongoose.Types.ObjectId(newProject._id),
      name: "Update person",
      actionType: "update",
      type: actionType,
      value: { name: newProject.name, img: newProject.logo },
      date: new Date(),
      status: "moderator",
      category: "persons",
    };

    await this.actionsService.addAction(action);

    await this.userModel.findByIdAndUpdate(initiator, {
      $inc: { personLimit: -1 },
    });

    await this.activityService.createActivity({
      userId: new mongoose.Types.ObjectId(initiator),
      createdAt: new Date(),
      title: "",
      type: "other",
      link: "",
      text: `You have updated the person <button data-path="/crypto/persons/${updatedProject._id}" class="inline-button">${updatedProject.name}</button>`,
    });

    return newProject;
  }

  async editPerson(
    id: string,
    updatePersonDto: UpdatePersonDto,
    roleData: RolesDto,
    initiator: string
  ) {
    const updatedProject = await this.personModel.findById(id);

    const isNewLogo: boolean = typeof updatePersonDto.logo !== "string";

    const newLogo: string =
      isNewLogo && updatePersonDto.logo
        ? await this.filesService.writeFile(updatePersonDto.logo)
        : updatedProject.logo;

    const { success } =
      updatedProject.logo && isNewLogo
        ? await this.filesService.removeFile(updatedProject.logo)
        : { success: true };

    if (!success) return "Update error";

    const participated: Array<mongoose.Types.ObjectId> =
      updatePersonDto?.participated?.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const colleagues: Array<mongoose.Types.ObjectId> =
      updatePersonDto?.colleagues?.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const updatedProjectTmp = {
      ...updatePersonDto,
      logo: newLogo,
      comments: updatedProject.comments,
    };

    if (participated) updatedProjectTmp.participated = participated;
    if (colleagues) updatedProjectTmp.colleagues = colleagues;

    if (roleData.isAdmin) {
      const editedProject = await this.personModel.findByIdAndUpdate(
        id,
        this.withPersonScores({
          ...updatedProject.toObject(),
          ...updatedProjectTmp,
        })
      );

      return editedProject;
    }

    if (roleData.isModerator) {
      const newProjectData = this.withPersonScores({
        ...updatedProject.toObject(),
        ...updatedProjectTmp,
        isDuplicate: true,
        projectStatus: "admin",
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
      });

      const newProject = await this.personModel.create(newProjectData);

      const actionType: string = `Update person on crypto page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update person",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "admin",
        category: "persons",
      };

      await this.actionsService.addAction(action);

      return newProject;
    }

    if (roleData.isUser) {
      const newProjectData = this.withPersonScores({
        ...updatedProject.toObject(),
        ...updatedProjectTmp,
        isDuplicate: true,
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
        projectStatus: "moderator",
      });

      const newProject = await this.personModel.create(newProjectData);

      const actionType: string = `Update person on crypto page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update person",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "moderator",
        category: "persons",
      };

      await this.actionsService.addAction(action);

      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { personLimit: -1 },
      });

      return newProject;
    }
  }

  async updatePersonProject(
    projects: Array<string>,
    id: string,
    key: "participated" | "colleagues",
    initiator: string,
    roleData: RolesDto
  ): Promise<any> {
    if (roleData.isAdmin) {
      const existingPerson = await this.personModel.findById(id).lean();
      const projectIds = projects.map((id: string) => new mongoose.Types.ObjectId(id));

      return await this.personModel.findByIdAndUpdate(id, this.withPersonScores({
        ...existingPerson,
        [key]: projectIds,
      }));
    }

    if (roleData.isModerator) {
      const existingPerson = await this.personModel.findById(id).exec();

      const newProjectData = this.withPersonScores({
        ...existingPerson.toObject(),
        isDuplicate: true,
        projectStatus: "admin",
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
        [key]: projects.map((id: string) => new mongoose.Types.ObjectId(id)),
      });

      const newProject = await this.personModel.create(newProjectData);

      const actionType: string = `Update person on crypto page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update person",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "admin",
        category: "persons",
      };

      await this.actionsService.addAction(action);

      return newProject;
    }

    if (roleData.isUser) {
      const existingPerson = await this.personModel.findById(id).exec();

      const newProjectData = this.withPersonScores({
        ...existingPerson.toObject(),
        isDuplicate: true,
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
        projectStatus: "moderator",
        [key]: projects.map((id: string) => new mongoose.Types.ObjectId(id)),
      });

      const newProject = await this.personModel.create(newProjectData);

      const actionType: string = `Update person on crypto page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update person",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "moderator",
        category: "persons",
      };

      await this.actionsService.addAction(action);

      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { personLimit: -1 },
      });

      return newProject;
    }
  }

  async addComment(id: string, comment: commentDto): Promise<Array<any>> {
    const project = await this.personModel.findById(id);

    const createdComment = await this.commentsService.createComment(comment);

    if (project.comments) {
      project.comments = [createdComment._id, ...project.comments];
    } else {
      project.comments = [createdComment._id];
    }

    await project.save();

    return project.comments;
  }

  async removeComment(id: string, comment: string): Promise<Array<any>> {
    const project = await this.personModel.findOne({ _id: id });

    await this.commentsService.removeComment(comment);

    const filteredComments: Array<any> = project.comments.filter(
      (prComment) => String(prComment._id) !== comment
    );

    project.comments = filteredComments;

    await project.save();

    return filteredComments;
  }

  async removeProject(id: string) {
    const project = await this.personModel.findOneAndDelete({ _id: id });

    return project;
  }

  async toggleRedStatus(id: string) {
    const project = await this.personModel.findById(id);

    project.redStatus = !project.redStatus;

    return await project.save();
  }

  async changeStatus(id: string, status: string) {
    const project = await this.personModel.findById(id);

    project.status = status;

    return await project.save();
  }

  async updateSponsoredStatus(id: string) {
    const project = await this.personModel.findById(id);

    project.isSponsored = !project.isSponsored;

    return await project.save();
  }

  async updateEralashStatus(id: string) {
    const project = await this.personModel.findById(id);

    project.isEralash = !project.isEralash;
    project.eralashAdded = new Date();

    return await project.save();
  }

  async addLike(itemId: string, userId: string): Promise<Person> {
    const item = await this.personModel.findById(itemId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (item.likes.includes(uId)) {
      return this.personModel
        .findByIdAndUpdate(itemId, { $pull: { likes: uId } }, { new: true })
        .exec();
    }

    return this.personModel
      .findByIdAndUpdate(
        itemId,
        {
          $addToSet: { likes: uId },
          $pull: { dislikes: uId },
        },
        { new: true }
      )
      .exec();
  }

  async addDislike(itemId: string, userId: string): Promise<Person> {
    const item = await this.personModel.findById(itemId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (item.dislikes.includes(uId)) {
      return this.personModel
        .findByIdAndUpdate(itemId, { $pull: { dislikes: uId } }, { new: true })
        .exec();
    }

    return this.personModel
      .findByIdAndUpdate(
        itemId,
        {
          $addToSet: { dislikes: uId },
          $pull: { likes: uId },
        },
        { new: true }
      )
      .exec();
  }
}
