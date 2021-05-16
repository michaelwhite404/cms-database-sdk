import Database from "../databaseInterfaces";
import { MultipleResultsReponse } from "./default";

export interface APIDatabasesRepsonse extends MultipleResultsReponse {
  status: "success";
  databases: Database[];
}

export interface APIDatabaseRepsonse {
  status: "success";
  database: Database;
}

export interface APIDeletedDatabaseResponse {
  status: "success";
  databasesDeleted: number;
  collectionsDeleted: number;
  itemsDeleted: number;
}
