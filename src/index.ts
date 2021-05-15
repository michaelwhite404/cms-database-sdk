import axios, { AxiosError, AxiosPromise, AxiosRequestConfig, Method } from "axios";

import CMSError, { buildRequiredArgError } from "./CMSError";
import Collection from "./interfaces/collectionInterfaces";

const DEFAULT_ENDPOINT = "http://localhost:5000/api/v1";

interface Headers {
  Accept: string;
  Authorization: string;
  "accept-version": string;
  "Content-Type": string;
}

interface CMSConstruct {
  /**
   * @param token - The API token
   */
  token?: string;
  /**
   * @param version - The API version
   */
  version?: string;
}

interface QueryFeatures<T> {
  /**
   * @param page The paginated page of the results
   * @default 1
   */
  page?: number;
  /**
   * @param limit The number of results the response is limited to
   * @default 100
   */
  limit?: number;
  sort?: string;
  fields?: Array<keyof T>;
}

type DatabaseShareRoles = "editor" | "viewer";

interface Database {
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

interface MultipleResultsReponse {
  results: number;
  page: number;
  limit: number;
}

interface APIDatabasesRepsonse extends MultipleResultsReponse {
  status: "success";
  databases: Database[];
}

interface APIDatabaseRepsonse {
  status: "success";
  database: Database;
}

interface APIDeletedDatabaseResponse {
  status: "success";
  databasesDeleted: number;
  collectionsDeleted: number;
  itemDeleted: number;
}

type DeletedDatabaseResponse = Omit<APIDeletedDatabaseResponse, "status">;

interface APIGenericResponse {
  status: "success";
  message: "string";
}

interface SharePassed {
  shared: true;
  message: string;
}

interface ShareFailed {
  shared: false;
  message: string;
}

type ShareResult = SharePassed | ShareFailed;

type BasicCollectionInfo = Pick<
  Collection,
  "_id" | "name" | "slug" | "createdAt" | "lastUpdated" | "singularName"
>;

interface APICollectionsResponse extends MultipleResultsReponse {
  status: "success";
  database: string;
  collections: BasicCollectionInfo[];
}

class MyCMS {
  private endpoint: string;
  token: string;
  version: string;
  private headers: Headers;
  private authenticatedFetch: <T = any>(
    method: Method,
    path: string,
    data: any,
    query?: {}
  ) => AxiosPromise<T>;

  constructor({ token, version = "1.0.0" }: CMSConstruct = {}) {
    if (!token) throw buildRequiredArgError("token");

    this.endpoint = DEFAULT_ENDPOINT;
    this.token = token;
    this.version = version;

    this.headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "accept-version": version,
      "Content-Type": "application/json",
    };

    this.authenticatedFetch = <T>(method: Method, path: string, data: any, query = {}) => {
      // const queryString = query && Object.keys(query).length === 0 ? `?${qs.stringify(query)}` : "";

      // const url = `${this.endpoint}${path}${queryString}`;
      const config: AxiosRequestConfig = {
        url: `${this.endpoint}${path}`,
        method,
        headers: this.headers,
        data,
        params: query,
      };

      // return axios(config)
      //   .then((res) => console.log(res.data))
      //   .catch((err) => console.log(err.response.data));

      return axios(config) as AxiosPromise<T>;
    };
  }

  // Generic HTTP request handlers

  private get<T = any>(path: string, query = {}) {
    return this.authenticatedFetch<T>("GET", path, false, query);
  }

  private post<T = any>(path: string, data: any, query = {}) {
    return this.authenticatedFetch<T>("POST", path, data, query);
  }

  private put<T = any>(path: string, data: any, query = {}) {
    return this.authenticatedFetch<T>("PUT", path, data, query);
  }

  private patch<T = any>(path: string, data: any, query = {}) {
    return this.authenticatedFetch<T>("PATCH", path, data, query);
  }

  private delete<T = any>(path: string, query = {}) {
    return this.authenticatedFetch<T>("DELETE", path, query);
  }

  // Databases

  /**
   * Gets all the databases the user has access to
   * @param query The query that will be added to the request
   * */
  async getDatabases(query: QueryFeatures<Database> = {}) {
    const res = await this.get<APIDatabasesRepsonse>("/databases", query);
    return res.data.databases;
  }

  /**
   * Retrieves database by database ID. Returns null if no database is found
   * @param database_id The unique ID of the database
   */
  async getDatabaseById(database_id: string) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    try {
      const res = await this.get<APIDatabaseRepsonse>(`/databases/${database_id}`);
      return res.data.database;
    } catch (err) {
      return null;
    }
  }

  /**
   * Creates a new database
   * @param name The name of the database
   * @returns {Database} The created Database
   */
  async createDatabase(name: string): Promise<Database> {
    if (!name) return Promise.reject(buildRequiredArgError("name"));
    try {
      const res = await this.post<APIDatabaseRepsonse>("/databases", { name });
      return res.data.database;
    } catch (err) {
      return Promise.reject({
        message: (err as AxiosError<CMSError>).response!.data.message,
      });
    }
  }

  /**
   * Deletes a database by database ID. Returns null if no database is found
   * @param database_id The unique ID of the database
   * @returns Object with info on the delete database request. Null if no database is found
   */
  async deleteDatabaseById(database_id: string) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    try {
      const res = await this.delete<APIDeletedDatabaseResponse>(`/databases/${database_id}`);
      const { status, ...data } = res.data;
      return data as DeletedDatabaseResponse;
    } catch (err) {
      return null;
    }
  }

  /**
   * Shares a database by database ID with another user by email. Returns null if no
   * database is found.
   * @param database_id The unique ID of the database
   * @param email The email of the user that the database will be shared with
   * @param role The role the user will have within the database
   * @returns {ShareResult} Object with `shared` boolean property explaining if the database was shared
   * and a `message` property explaining the result
   */
  async shareDatabase(
    database_id: string,
    email: string,
    role: DatabaseShareRoles
  ): Promise<ShareResult> {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    if (!email) return Promise.reject(buildRequiredArgError("email"));
    if (!role) return Promise.reject(buildRequiredArgError("role"));
    try {
      const res = await this.post<APIGenericResponse>(`/databases/${database_id}/share`, {
        email,
        role,
      });
      return { shared: true, message: res.data.message };
    } catch (err) {
      return { shared: false, message: (err as AxiosError<CMSError>).response!.data.message };
    }
  }

  /**
   * Updates a database's name based on the database ID. Returns null if no database
   * is found
   * @param database_id The unique database ID
   * @param name The new name of the database
   * @returns The new, updated database if the database was found. Returns null
   * if no database is found
   */
  async updateDatabaseById(database_id: string, name: string) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    if (!name) return Promise.reject(buildRequiredArgError("name"));
    try {
      const res = await this.patch<APIDatabaseRepsonse>(`/databases/${database_id}`, { name });
      return res.data.database;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid database"))
        return null;
      return Promise.reject({
        message: (err as AxiosError<CMSError>).response!.data.message,
      });
    }
  }

  // Collections

  /** Gets all collections in a database by database ID */
  async getCollectionsByDatabaseId(database_id: string) {
    const res = await this.get<APICollectionsResponse>(`/databases/${database_id}/collections`);
    return res.data.collections;
  }
}
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODI1ZDhhNmEyMzQwNjlkY2RjMWFiYyIsImlhdCI6MTYyMDE0MzQ2NywiZXhwIjoxNjUxNjc5NDY3fQ.ezSf7wahKljsf-S411fZ7K0ZnIKXccvs4ELYzMK_tq8";

/**
 * Creates a CMS instance. This function must recieve an object that accepts an
 * API token property
 * @param initilizer
 * @param initilizer.token The API token
 * @param initilizer.version The API version
 */
export default function init(initilizer: CMSConstruct = {}) {
  const { token, version } = initilizer;
  return new MyCMS({ token, version });
}
// Tests
const myCMS = init({ token });
// const databases = myCMS.getDatabases({ page: 2, limit: 2, fields: ["name", "slug"] });
// databases.then((d) => console.log(d));
// const database = myCMS.getDatabaseById("60837f1c774a7f66e03f4f27");
// database.then((d) => console.log(d)).catch((err) => console.log(err));
// const database = myCMS.createDatabase("Another One");
// database.then((d) => console.log(d)).catch((err) => console.log(err));
// const database = myCMS.deleteDatabaseById("609f1e7ade3ee95b102d0c19");
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
// const database = myCMS.shareDatabase("609dd26ede3ee95b102d0c16", "second@user.com", "viewer");
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
// const database = myCMS.updateDatabaseById("60a0055f4b52a351c824b9bg", "Mike");
// database.then((d) => console.log(d)).catch((err) => console.log(err));

// const getDatabase = async (id: string) => {
//   const database = await myCMS.getDatabaseById(id);
//   if (!database) return "No Database";

//   return database;
// };
// getDatabase("60837f1c774a7f66e03f4f27").then((d) => console.log(d));

myCMS.getCollectionsByDatabaseId("60837f1c774a7f66e03f4f27").then((c) => console.log(c));
