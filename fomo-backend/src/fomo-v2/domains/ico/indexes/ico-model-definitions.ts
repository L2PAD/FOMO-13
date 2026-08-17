import {
  FomoV2IcoProjectReadModel,
  FomoV2IcoProjectReadModelSchema,
  FomoV2IcoProjectSource,
  FomoV2IcoProjectSourceSchema,
} from "../models";

export const FOMO_V2_ICO_MODEL_DEFINITIONS = [
  {
    name: FomoV2IcoProjectReadModel.name,
    schema: FomoV2IcoProjectReadModelSchema,
  },
];

export const FOMO_V2_ICO_PARSER_MODEL_DEFINITIONS = [
  {
    name: FomoV2IcoProjectSource.name,
    schema: FomoV2IcoProjectSourceSchema,
  },
];
