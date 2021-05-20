import Item from "../itemInterfaces";
import { APIDeletedCollectionResponse } from "./collection";
import { MultipleResultsReponse } from "./default";

export interface APIItemsResponse<T extends Item> extends MultipleResultsReponse {
  status: "success";
  items: T[];
}

export interface APIItemResponse<T extends Item> {
  status: "success";
  item: T;
}

export type APIDeletedItemResponse = Omit<APIDeletedCollectionResponse, "collectionsDeleted">;
