import Collection, { BasicCollectionInfo, CollectionField } from "../collectionInterfaces";
import { APIDeletedDatabaseResponse } from "../apiResponses/database";
import { MultipleResultsReponse } from "./default";

export interface APICollectionsResponse extends MultipleResultsReponse {
  status: "success";
  database: string;
  collections: BasicCollectionInfo[];
}

export interface APICollectionResponse {
  status: "success";
  collection: Collection;
}
export type APIDeletedCollectionResponse = Omit<APIDeletedDatabaseResponse, "databasesDeleted">;

export interface APICollectionFieldsResponse {
  status: "success";
  fields: CollectionField[];
}

export interface APICollectionFieldResponse {
  status: "success";
  field: CollectionField;
}
