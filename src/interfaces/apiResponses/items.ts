import Item from "../itemInterfaces";
import { APIDeletedCollectionResponse } from "./collection";
import { MultipleResultsReponse } from "./default";

export interface APIItemsResponse extends MultipleResultsReponse {
  status: "success";
  items: Item[];
}

export interface APIItemResponse {
  status: "success";
  item: Item;
}

export type APIDeletedItemResponse = Omit<APIDeletedCollectionResponse, "collectionsDeleted">;
