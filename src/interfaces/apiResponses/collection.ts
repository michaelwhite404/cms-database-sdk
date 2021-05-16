import Collection, { BasicCollectionInfo } from "../collectionInterfaces";
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
