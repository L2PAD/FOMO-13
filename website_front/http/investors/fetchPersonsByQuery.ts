import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type PersonSupportedProjectPreview = {
  id?: string;
  name: string;
  slug?: string;
  logo?: string;
  image?: string;
  symbol?: string;
};

export type PersonListItem = {
  _id: string;
  id: string;
  slug?: string;
  name: string;
  avatar?: string;
  logo?: string;
  type?: string;
  niche?: string;
  specialization?: string;
  specializations?: string[];
  country?: string;
  location?: string;
  currentRole?: string;
  organizationName?: string;
  organizationSlug?: string;
  organizationLogo?: string;
  rating?: number;
  fullness?: number;
  roi?: number | null;
  roiDisplay?: string;
  athRoi?: number | string;
  totalInvested?: number | string;
  projectsCount: number;
  supportedProjectsCount: number;
  supportedProjectsPreview: PersonSupportedProjectPreview[];
  sectors?: string[];
  tags?: string[];
  socialLinks?: Record<string, string | undefined>;
  socialmedia?: Array<{ href: string; name?: string }>;
  regionData?: any;
  countryFlag?: string;
  fomoScore?: number;
  redFlagsList?: any[];
  likes?: any[];
  lastUpdatedAt?: string;
};

export type PersonsFilterOptions = {
  sectors?: string[];
  specializations?: string[];
};

export type PersonsListResponse = {
  isSuccess: boolean;
  persons: PersonListItem[];
  items: PersonListItem[];
  total: number;
  totalCount: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  filterOptions?: PersonsFilterOptions;
};

const emptyResponse: PersonsListResponse = {
  isSuccess: false,
  persons: [],
  items: [],
  total: 0,
  totalCount: 0,
};

export default async function fetchPersonsByQuery(
  query = ""
): Promise<PersonsListResponse> {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/investors/persons${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    const persons = Array.isArray(data?.items) ? data.items : [];
    const total = Number(data?.total ?? data?.totalCount ?? 0);

    return {
      isSuccess: res.ok && !data?.message,
      persons,
      items: persons,
      total,
      totalCount: total,
      page: data?.page,
      limit: data?.limit,
      totalPages: data?.totalPages,
      filterOptions: data?.filterOptions,
    };
  } catch (error) {
    console.log(error);

    return emptyResponse;
  }
}
