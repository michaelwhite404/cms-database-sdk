import axios, { AxiosError, AxiosPromise, AxiosRequestConfig, Method } from "axios";
import CMSError, { buildRequiredArgError } from "./CMSError";
// import qs from "qs";

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

interface DatabasesQuery {
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
}

type DatabaseRole = "owner" | "editor" | "viewer";

interface DatabaseShareParams extends DatabaseId {
  email: string;
  role: DatabaseRole;
}

interface DatabaseId {
  database_id: string;
}

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

interface APIDatabaseRepsonse {
  status: "success";
  database: Database;
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

  private get<T>(path: string, query = {}) {
    return this.authenticatedFetch<T>("GET", path, false, query);
  }

  private post(path: string, data: any, query = {}) {
    return this.authenticatedFetch("POST", path, data, query);
  }

  private put(path: string, data: any, query = {}) {
    return this.authenticatedFetch("PUT", path, data, query);
  }

  private patch(path: string, data: any, query = {}) {
    return this.authenticatedFetch("PATCH", path, data, query);
  }

  private delete(path: string, query = {}) {
    return this.authenticatedFetch("DELETE", path, query);
  }

  // Databases

  /**
   * Gets all the databases the user has access to
   * @param query The query that will be added to the request
   * @param query.limit The number of results the response is limited to
   * @param query.page The paginated page of the results
   * */
  async getDatabases(query: DatabasesQuery = {}) {
    const res = await this.get("/databases", query);
    return res.data;
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

  /** Creates a new database */
  async createDatabase({ name }: { name: string }) {
    if (!name) return Promise.reject(buildRequiredArgError("name"));
    try {
      const res = await this.post("/databases", { name });
      return res.data;
    } catch (err) {
      return (err as AxiosError<CMSError>).response!.data;
    }
  }

  /** Deletes a database */
  async deleteDatabase({ database_id }: { database_id: string }) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    try {
      const res = await this.delete(`/databases/${database_id}`);
      return res.data;
    } catch (err) {
      return (err as AxiosError<CMSError>).response!.data;
    }
  }

  /** Share a database with another user by email */
  async shareDatabase({ database_id, email, role }: DatabaseShareParams) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    if (!email) return Promise.reject(buildRequiredArgError("email"));
    if (!role) return Promise.reject(buildRequiredArgError("role"));
    try {
      const res = await this.post(`/databases/${database_id}/share`, { email, role });
      return res.data;
    } catch (err) {
      return (err as AxiosError<CMSError>).response!.data;
    }
  }

  /** Updates a database's name based on the database ID */
  async updateDatabase({ database_id, name }: { database_id: string; name: string }) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    if (!name) return Promise.reject(buildRequiredArgError("name"));
    try {
      const res = await this.patch(`/databases/${database_id}`, { database_id, name });
      return res.data;
    } catch (err) {
      return (err as AxiosError<CMSError>).response!.data;
    }
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
// const databases = myCMS.getDatabases({ limit: 2, page: 2 });
// databases.then((d) => console.log(d));
// const database = myCMS.getDatabaseById("60837f1c774a7f66e03f4f27");
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
// const database = myCMS.createDatabase({ name: "Another Database" });
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
// const database = myCMS.deleteDatabase({ database_id: "609f1e7ade3ee95b102d0c19" });
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
// const database = myCMS.shareDatabase({
//   database_id: "609dd26ede3ee95b102d0c16",
//   email: "second@user.com",
//   role: "viewer",
// });
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
// const database = myCMS.updateDatabase({
//   database_id: "609f1e7ade3ee95b102d0c19",
//   name: "Another Edited Database",
// });
// database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));

const getDatabase = async (id: string) => {
  const database = await myCMS.getDatabaseById(id);
  if (!database) return "No Database";

  return database;
};
getDatabase("60837f1c774a7f66e03f4f27").then((d) => console.log(d));
