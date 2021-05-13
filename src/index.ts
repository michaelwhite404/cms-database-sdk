import axios, { AxiosError, AxiosPromise, AxiosRequestConfig, AxiosResponse, Method } from "axios";
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
  token?: string;
  version?: string;
}

interface DatabasesQuery {
  /**
   * The paginated page of the results
   * @default 1
   */
  page?: number;
  /**
   * The amount of documents the response is limited to
   * @default 100
   */
  limit?: number;
}

export default class MyCMS {
  private endpoint: string;
  token: string;
  version: string;
  private headers: Headers;
  private authenticatedFetch: (
    method: Method,
    path: string,
    data: any,
    query?: {}
  ) => AxiosPromise<any>;

  constructor({ token, version = "1.0.0" }: CMSConstruct = {}) {
    if (!token) throw "no token";

    this.endpoint = DEFAULT_ENDPOINT;
    this.token = token;
    this.version = version;

    this.headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "accept-version": version,
      "Content-Type": "application/json",
    };

    this.authenticatedFetch = (method: Method, path: string, data, query = {}) => {
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

      return axios(config);
    };
  }

  // Generic HTTP request handlers

  private get(path: string, query = {}) {
    return this.authenticatedFetch("GET", path, false, query);
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

  /** Gets all the databases the user has access to */
  async getDatabases(query: DatabasesQuery = {}) {
    const res = await this.get("/databases", query);
    return res.data;
  }

  async getDatabase({ database_id }: { database_id: string }, query = {}) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    try {
      const res = await this.get(`/databases/${database_id}`, query);
      return res.data;
    } catch (err) {
      return err.response.data;
    }
  }
}
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODI1ZDhhNmEyMzQwNjlkY2RjMWFiYyIsImlhdCI6MTYyMDE0MzQ2NywiZXhwIjoxNjUxNjc5NDY3fQ.ezSf7wahKljsf-S411fZ7K0ZnIKXccvs4ELYzMK_tq8";
const myCMS = new MyCMS({ token });

// const databases = myCMS.getDatabases({ limit: 2, page: 2 });
// databases.then((d) => console.log(d));

const database = myCMS.getDatabase({ database_id: "" });
database.then((d) => console.log(d)).catch((err) => console.log(new CMSError(err)));
