import { APIDeletedDatabaseResponse } from "./apiResponses/database";

export default interface Database {
  /** The database _id */
  _id: string;
  /** The name of the database */
  name: string;
  /** The user that created the database */
  createdBy: string;
  /** Unique slug identifier for the database */
  slug: string;
  /** The timezone of the client of the database creator */
  timezone: string;
  /** The date the database was created */
  createdAt: Date;
}
export type DatabaseShareRoles = "editor" | "viewer";
export type ShareResult = SharePassed | ShareFailed;
interface SharePassed {
  shared: true;
  message: string;
}

interface ShareFailed {
  shared: false;
  message: string;
}

export type DeletedDatabaseResponse = Omit<APIDeletedDatabaseResponse, "status">;
