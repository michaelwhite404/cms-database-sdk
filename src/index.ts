import axios, { AxiosError, AxiosPromise, AxiosRequestConfig, Method } from "axios";
import { Query, UpdateQuery } from "mongoose";

import CMSError, { buildRequiredArgError } from "./CMSError";
import Database, {
  DatabaseShareRoles,
  DeletedDatabaseResponse,
  ShareResult,
} from "./interfaces/databaseInterfaces";
import Collection, {
  APIDeletedCollectionFieldResponse,
  CollectionData,
  CollectionDataFields,
  CollectionField,
  DeletedCollectionFieldResponse,
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
  APICollectionFieldResponse,
  APICollectionFieldsResponse,
  APICollectionResponse,
  APICollectionsResponse,
  APIDeletedCollectionResponse,
} from "./interfaces/apiResponses/collection";
import {
  APIDeletedItemResponse,
  APIItemResponse,
  APIItemsResponse,
} from "./interfaces/apiResponses/items";
import Item, { DeletedItemResponse } from "./interfaces/itemInterfaces";
import { APIUserResponse } from "./interfaces/apiResponses/user";
import User from "./interfaces/userInterface";

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

type RemoveIndex<T> = {
  [P in keyof T as string extends P ? never : number extends P ? never : P]: T[P];
};

type ItemData<T> = Omit<RemoveIndex<T>, keyof RemoveIndex<Item>>;

type CallbackError = CMSError | null;

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
    process.env.CMSTOKEN = token;
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
   * @returns {Promise<Database | null>} The new, updated database if the database was found. Returns
   * null if no database is found
   */
  async updateDatabaseById(database_id: string, name: string): Promise<Database | null> {
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
   * @returns {Promise<DeletedCollectionResponse | null>} Object with info on the delete collection
   * request. Null if no collection is found
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

  /**
   * Gets all items in a collection by `collection_id`
   * @param collection_id The unique collection ID
   * @param query The query that will be added to the request
   * @returns All items in the collection
   */
  async getItemsByCollectionId<ItemModel extends Item>(
    collection_id: string,
    query: QueryFeatures<RemoveIndex<ItemModel>> = {}
  ) {
    const finalQuery = this.createFinalQuery(query);
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    const res = await this.get<APIItemsResponse<ItemModel>>(
      `/collections/${collection_id}/items`,
      finalQuery
    );
    return res.data.items;
  }

  /**
   * Gets an item. Parameters must include both `collection_id` and `item_id`. Returns
   * null if either the `collection_id` is not valid or a combination of the
   * `collection_id` and the `item_id` is not found. Returns null if no item is
   * found.
   * @param collection_id The unique collection ID
   * @param item_id The unique item ID
   * @returns {Promise<ItemModel | null>} The queried item. Null if no item is found
   */
  async getItem<ItemModel extends Item>(
    collection_id: string,
    item_id: string
  ): Promise<ItemModel | null> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    try {
      const res = await this.get<APIItemResponse<ItemModel>>(
        `/collections/${collection_id}/items/${item_id}`
      );
      return res.data.item;
    } catch (err) {
      return null;
    }
  }

  /**
   * Creates a new Item in a Collection by `collection_id`.
   * @param collection_id The unique collection ID
   * @param data The fields of the Item being added to the Collection
   * @returns {Promise<ItemModel>} A new Item
   */
  async createItem<ItemModel extends Item>(
    collection_id: string,
    data: ItemData<ItemModel>
  ): Promise<ItemModel> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!data) return Promise.reject(buildRequiredArgError("data"));
    try {
      const res = await this.post<APIItemResponse<ItemModel>>(
        `/collections/${collection_id}/items`,
        data
      );
      return res.data.item;
    } catch (err) {
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Updates an Item. Only the fields in `fields` parameter will be updated.
   * Parameters must include both `collection_id` and `item_id`. Returns null if
   * either the `collection_id` is not valid or a combination of the
   * `collection_id` and the `item_id` is not found.
   * @param collection_id The unique collection ID
   * @param item_id The unique item ID
   * @param fields The updated fields of the Item
   * @returns {Promise<ItemModel | null>} The updated Item. Returns null if no Item was found.
   */
  async patchItemById<ItemModel extends Item>(
    collection_id: string,
    item_id: string,
    fields: Partial<ItemData<ItemModel>>
  ): Promise<ItemModel | null> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    if (!fields) return Promise.reject(buildRequiredArgError("fields"));
    try {
      const res = await this.patch<APIItemResponse<ItemModel>>(
        `/collections/${collection_id}/items/${item_id}`,
        fields
      );
      return res.data.item;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid _id")) {
        return null;
      }
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Updates an Item. Replaces the fields of an existent Item with the fields specified
   * in the `fields` parameter. Parameters must include both `collection_id` and
   * `item_id`. Returns null if either the `collection_id` is not valid or a
   * combination of the `collection_id` and the `item_id` is not found.
   * @param collection_id The unique collection ID
   * @param item_id The unique item ID
   * @param fields The updated fields of the Item
   * @returns {Promise<ItemModel | null>} The updated Item. Returns null if no Item was found.
   */
  async putItemById<ItemModel extends Item>(
    collection_id: string,
    item_id: string,
    fields: ItemData<ItemModel>
  ): Promise<ItemModel | null> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    if (!fields) return Promise.reject(buildRequiredArgError("fields"));
    try {
      const res = await this.put<APIItemResponse<ItemModel>>(
        `/collections/${collection_id}/items/${item_id}`,
        fields
      );
      return res.data.item;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid _id")) {
        return null;
      }
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  /**
   * Deletes an item. Parameters must include both `collection_id` and
   * `item_id`. Returns null if either the `collection_id` is not valid or a
   * combination of the `collection_id` and the `item_id` is not found.
   * @param collection_id The unique collection ID
   * @param item_id The unique item ID
   * @returns {Promise<DeletedItemResponse | null>} Object with info on the delete Item
   * request. Null if no Item is found
   */
  async deleteItemById(
    collection_id: string,
    item_id: string
  ): Promise<DeletedItemResponse | null> {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!item_id) return Promise.reject(buildRequiredArgError("item_id"));
    try {
      const res = await this.delete<APIDeletedItemResponse>(
        `/collections/${collection_id}/items/${item_id}`
      );
      const { status, ...data } = res.data;
      return data as DeletedItemResponse;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      if (response.status === 404 || response.data.message.startsWith("Invalid _id")) return null;
      return Promise.reject((err as AxiosError<CMSError>).response!.data);
    }
  }

  // Fields

  /**
   * Returns all collection fields in a collection by `collection_id`. Will return `null` if no
   * collection is found
   * @param collection_id The unique collection ID
   */
  async getCollectionFields(
    collection_id: string,
    callback?: (err: CallbackError, data: CollectionField[] | null) => void
  ) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    try {
      const res = await this.get<APICollectionFieldsResponse>(
        `/collections/${collection_id}/fields`
      );
      const { fields } = res.data;
      tryCallback(callback, null, fields);
      return fields;
    } catch (err) {
      tryCallback(callback, null, null);
      return null;
    }
  }

  /**
   * Return a field in a collection by `collection_id` and `field_id`. Parameters
   * must include both `collection_id` and `field_id`. Returns null if either the
   * `collection_id` is not valid or a combination of the `collection_id` and the
   * `field_id` is not found.
   * @param collection_id The unique collection ID
   * @param field_id The unique field ID
   */
  async getCollectionField(
    collection_id: string,
    field_id: string,
    callback?: (err: CallbackError, data: CollectionField | null) => void
  ) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!field_id) return Promise.reject(buildRequiredArgError("field_id"));
    try {
      const res = await this.get<APICollectionFieldResponse>(
        `/collections/${collection_id}/fields/${field_id}`
      );
      const { field } = res.data;
      tryCallback(callback, null, field);
      return field;
    } catch (err) {
      tryCallback(callback, null, null);
      return null;
    }
  }

  /**
   * Creates a new field in a collection by `collection_id`
   * @param collection_id The unique collection ID
   * @param data The fields of the Collection Field being added to the Collection
   * @returns A new Collection Field
   */
  async createCollectionField(
    collection_id: string,
    data: CollectionDataFields,
    callback?: (err: CallbackError, data: CollectionField) => void
  ) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!data) return Promise.reject(buildRequiredArgError("data"));
    try {
      const res = await this.post<APICollectionFieldResponse>(
        `/collections/${collection_id}/fields/`,
        data
      );
      const { field } = res.data;
      tryCallback(callback, null, field);
      return field;
    } catch (err) {
      const { data } = (err as AxiosError<CMSError>).response!;
      tryCallback(callback, data, null);
      return Promise.reject(data);
    }
  }

  /**
   * Updates a Collection Field. Parameters must include both `collection_id` and
   * `field_id`. Returns null if either the `collection_id` is not valid or a
   * combination of the `collection_id` and the `field_id` is not found.
   * @param collection_id The unique collection ID
   * @param field_id The unique field ID
   * @param fields
   * @returns
   */
  async updateCollectionField(
    collection_id: string,
    field_id: string,
    fields: Partial<CollectionField>,
    callback?: (err: CallbackError, data: CollectionField | null) => void
  ) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!field_id) return Promise.reject(buildRequiredArgError("field_id"));
    if (!fields) return Promise.reject(buildRequiredArgError("fields"));
    try {
      const res = await this.patch<APICollectionFieldResponse>(
        `/collections/${collection_id}/fields/${field_id}`,
        fields
      );
      const { field } = res.data;
      tryCallback(callback, null, field);
      return field;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      const data = response.data;
      if (response.status === 404 || data.message.startsWith("Invalid _id")) {
        tryCallback(callback, null, null);
        return null;
      }
      tryCallback(callback, data, null);
      return Promise.reject(data);
    }
  }

  /**
   * Deletes a Collection Field. Parameters must include both `collection_id` and
   * `field_id`. Returns null if either the `collection_id` is not valid or a
   * combination of the `collection_id` and the `field_id` is not found.
   * @param collection_id The unique collection ID
   * @param field_id The unique field ID
   * @returns Object with info on the delete Collection Field request. Null if no
   * Collection Field is found
   */
  async deleteCollectionField(
    collection_id: string,
    field_id: string,
    callback?: (err: CallbackError, data: DeletedCollectionFieldResponse | null) => void
  ) {
    if (!collection_id) return Promise.reject(buildRequiredArgError("collection_id"));
    if (!field_id) return Promise.reject(buildRequiredArgError("field_id"));
    try {
      const res = await this.delete<APIDeletedCollectionFieldResponse>(
        `/collections/${collection_id}/fields/${field_id}`
      );
      const { status, ...data } = res.data;
      tryCallback(callback, null, data as DeletedCollectionFieldResponse);
      return data as DeletedCollectionFieldResponse;
    } catch (err) {
      const response = (err as AxiosError<CMSError>).response!;
      const data = response.data;
      if (response.status === 404 || data.message.startsWith("Invalid _id")) {
        tryCallback(callback, null, null);
        return null;
      }
      tryCallback(callback, data, null);
      return Promise.reject(data);
    }
  }

  // Users

  async getMe(callback?: (err: CallbackError, data: User) => void) {
    try {
      const res = await this.get<APIUserResponse>("/users/me");
      const user = res.data.user;
      tryCallback(callback, null, user);
      return user;
    } catch (err) {
      const data = (err as AxiosError<CMSError>).response!.data;
      tryCallback(callback, data, null);
      return Promise.reject(data);
    }
  }
}

/**
 * Runs a error-first callback function, if the callback is a function
 * @param callback The callback function
 * @param err The error being passed in
 * @param data The data passed in
 */
const tryCallback = <DataType>(callback: any, err: CallbackError, data: DataType): void => {
  if (callback && typeof callback === "function") {
    callback(err, data);
  }
};

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
// const api = init({ token });

// const me = api.getMe((err, data) => {
//   if (err) {
//     return console.log(err);
//   }
//   console.log(data);
// });
// me.then((i) => console.log(i)).catch((err) => console.log(err));

// api.getCollectionFields("6085aac7cb7ffb1780d6a9a2", (err, data) => {
//   if (err) return console.log(err);
//   if (!data) return console.log("No collection with this field exists");
//   return console.log(data);
// });

// const query = new Query();
// query.find({ a: 1 }).where("b").gt(2);
// query.getFilter();

// console.log(query);
