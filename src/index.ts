import axios, { AxiosError, AxiosPromise, AxiosRequestConfig, Method } from "axios";
import { UpdateQuery } from "mongoose";

import CMSError, { buildRequiredArgError } from "./CMSError";
import Database, {
  DatabaseShareRoles,
  DeletedDatabaseResponse,
  ShareResult,
} from "./interfaces/databaseInterfaces";
import Collection, {
  CollectionData,
  DeletedCollectionResponse,
  UpdateableCollectionProps,
} from "./interfaces/collectionInterfaces";
import { APIGenericResponse, Headers } from "./interfaces/apiResponses/default";
import { FinalQuery, QueryFeatures } from "./interfaces/queryInterfaces";
import {
  APIDatabaseRepsonse,
  APIDatabasesRepsonse,
  APIDeletedDatabaseResponse,
} from "./interfaces/apiResponses/database";
import {
  APICollectionResponse,
  APICollectionsResponse,
  APIDeletedCollectionResponse,
} from "./interfaces/apiResponses/collection";
import { APIItemResponse, APIItemsResponse } from "./interfaces/apiResponses/items";

const DEFAULT_ENDPOINT = "http://localhost:5000/api/v1";

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

  // Util Methods

  private createFinalQuery(query: QueryFeatures<any>): FinalQuery {
    let { fields, ...rest } = query;
    const finalQuery = rest as FinalQuery;
    if (fields && Array.isArray(fields)) {
      finalQuery.fields = fields.join(",");
    }
    return finalQuery;
  }

  // Databases

  /**
   * Gets all the databases the user has access to
   * @param query The query that will be added to the request
   * @returns {Promise<Database[]>} The returned databases
   * */
  async getDatabases(query: QueryFeatures<Database> = {}): Promise<Database[]> {
    const finalQuery = this.createFinalQuery(query);
    const res = await this.get<APIDatabasesRepsonse>("/databases", finalQuery);
    return res.data.databases;
  }

  /**
   * Retrieves database by `database_id`. Returns null if no database is found
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
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Deletes a database by `database_id`. Returns null if no database is found
   * @param database_id The unique ID of the database
   * @returns {Promise<DeletedDatabaseResponse | null>} Object with info on the delete database request.
   * Null if no database is found
   */
  async deleteDatabaseById(database_id: string): Promise<DeletedDatabaseResponse | null> {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    try {
      const res = await this.delete<APIDeletedDatabaseResponse>(`/databases/${database_id}`);
      const { status, ...data } = res.data;
      return data as DeletedDatabaseResponse;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid database"))
        return null;
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Shares a database by `database_id` with another user by email. Returns null if no
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
   * Updates a database's name based on the `database_id`. Returns null if no database
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
      const res = await this.patch<APIDatabaseRepsonse>(`/databases/${database_id}`, {
        name,
      });
      return res.data.database;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid database"))
        return null;
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  // Collections

  /**
   * Gets all collections in a database by `database_id`
   * @param database_id The unique database ID
   */
  async getCollectionsByDatabaseId(database_id: string) {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    const res = await this.get<APICollectionsResponse>(`/databases/${database_id}/collections`);
    return res.data.collections;
  }

  /**
   * Retrieves collection by `collection_id`. Returns null if no collection is found
   * @param collection_id The unique ID of the collection
   */
  async getCollectionById(collection_id: string) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    try {
      const res = await this.get<APICollectionResponse>(`/collections/${collection_id}`);
      return res.data.collection;
    } catch (err) {
      return null;
    }
  }

  /**
   * Creates a new collection in a database by `database_id`
   * @param database_id - The database ID of the database the collection is being added to
   * @param data - An object defining the `name`, `slug` (optional), and collection `fields`
   * @returns {Promise<Collection>} The created collection
   */
  async createCollectionByDatabaseId(
    database_id: string,
    data: CollectionData
  ): Promise<Collection> {
    if (!database_id) return Promise.reject(buildRequiredArgError("database_id"));
    if (!data) return Promise.reject(buildRequiredArgError("data"));
    try {
      const res = await this.post<APICollectionResponse>("/collections", {
        database: database_id,
        ...data,
      });
      return res.data.collection;
    } catch (err) {
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Updates collection properties by `collection_id`
   * @param collection_id The unique collection id
   * @param update An object of the collection properties being updated
   * @returns {Promise<Collection | null>} The updated collection. Null if no collection is found
   */
  async updateCollectionById(
    collection_id: string,
    update: UpdateQuery<UpdateableCollectionProps>
  ): Promise<Collection | null> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!update) return Promise.reject(buildRequiredArgError("update"));
    try {
      const res = await this.patch<APICollectionResponse>(`/collections/${collection_id}`, update);
      return res.data.collection;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid _id")) {
        return null;
      }
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Deletes collection by `collection_id`. Returns null if no collection is found.
   * @param collection_id The unique collection id
   * @returns {Promise<DeletedCollectionResponse | null>} Object with info on the delete collection request.
   * Null if no collection is found
   */
  async deleteCollectionById(collection_id: string): Promise<DeletedCollectionResponse | null> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    try {
      const res = await this.delete<APIDeletedCollectionResponse>(`/collections/${collection_id}`);
      const { status, ...data } = res.data;
      return data as DeletedCollectionResponse;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid _id")) return null;
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  // Items

  async getItemsByCollectionId(collection_id: string, query: QueryFeatures<Database> = {}) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    const res = await this.get<APIItemsResponse>(`/collections/${collection_id}/items`, query);
    return res.data.items;
  }

  async getItem(collection_id: string, item_id: string) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    try {
      const res = await this.get<APIItemResponse>(`/collections/${collection_id}/items/${item_id}`);
      return res.data.item;
    } catch (err) {
      return null;
    }
  }

  async createItem(collection_id: string, data: {}) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    // TODO
  }

  async patchItemById(collection_id: string, item_id: string, update: UpdateQuery<any>) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    if (!update) return Promise.reject(buildRequiredArgError("update"));
    // TODO
  }

  async putItemById(collection_id: string, item_id: string, update: UpdateQuery<any>) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    if (!update) return Promise.reject(buildRequiredArgError("update"));
    // TODO
  }

  async deleteItemById(collection_id: string, item_id: string) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    // TODO
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

// Get Item
const item = myCMS.getItem("6085aac7cb7ffb1780d6a9a2", "60860fded05c53422cf8ce36");
item.then((i) => console.log(i));
// Get All Items in Collection
const items = myCMS.getItemsByCollectionId("6085aac7cb7ffb1780d6a9a2");
items.then((items) => console.log(items));
