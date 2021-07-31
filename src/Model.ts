import { Query } from "mongoose";
import fetch from "sync-fetch";
import { APICollectionResponse } from "./interfaces/apiResponses/collection";
// import Collection from "./interfaces/collectionInterfaces";
import Item from "./interfaces/itemInterfaces";
import renameClass from "./utils/renameClass";

interface TestItem extends Item {
  "business-name": string;
  color: string;
  slug: string;
  /** A rating */
  rating: number;
}
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODI1ZDhhNmEyMzQwNjlkY2RjMWFiYyIsImlhdCI6MTYyMDE0MzQ2NywiZXhwIjoxNjUxNjc5NDY3fQ.ezSf7wahKljsf-S411fZ7K0ZnIKXccvs4ELYzMK_tq8";

interface Model<T> {
  new (doc?: T | any): T;
  modelName: string;
  collection_id: string;
  schema: any;
  create: () => void;
  deleteMany: () => void;
  deleteOne: () => void;
  findById: (id: any) => void;
  findOne: (filter?: any) => void;
  insertMany: () => void;
  populate: () => void;
  exists: () => void;
  find: () => void;
  findByIdAndDelete: () => void;
  findByIdAndRemove: () => void;
  findByIdAndUpdate: () => void;
  findOneAndDelete: () => void;
  findOneAndRemove: () => void;
  findOneAndReplace: () => void;
  findOneAndUpdate: () => void;
  updateMany: () => void;
  updateOne: () => void;
}

class Model<T extends Item> {
  constructor(doc?: T | any) {
    for (const key in doc) {
      this[key] = doc[key];
    }
  }
  [s: string]: any;
  static modelName: string;
  static collection_id: string;
  static schema: any;
  static create() {}
  static deleteMany() {}
  static deleteOne() {}

  /**
   * Finds a single document by its _id field. `findById(id)` is almost*
   * equivalent to `findOne({ _id: id })`. If you want to query by a document's
   * `_id`, use `findById()` instead of `findOne()`.
   *
   * @param {any} id value of `_id` to query by
   *
   */
  static findById(id: any) {}
  static findOne(filter?: any) {}
  static insertMany() {}
  static populate() {}
  static exists() {}
  static find() {}
  static findByIdAndDelete() {}
  static findByIdAndRemove() {}
  static findByIdAndUpdate() {}
  static findOneAndDelete() {}
  static findOneAndRemove() {}
  static findOneAndReplace() {}
  static findOneAndUpdate() {}
  static updateMany() {}
  static updateOne() {}
  static then() {
    return {};
  }
}
// type HMM = ReturnType<Model<T extends Item>>;

function model<T extends Item>(name: string, collection_id: string): Model<T> {
  const res = fetch<APICollectionResponse>(
    `http://localhost:5000/api/v1/collections/${collection_id}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  ).json();
  Model.collection_id = res.collection._id;
  Model.schema = res.collection.fields;
  Model.modelName = res.collection.name;

  // @ts-ignore
  return renameClass(name, Model);
}

const Post = model<TestItem>("Post", "60cdc74497564961fc2035e7");
console.log(Post);
// const post = Post.create();
// const getpost = Post.findById();
const post = new Post({ title: "I love ES6", author: "Michael White", published: new Date() });
console.log(post);
console.log(post instanceof Post);
// const query = new Query();

// console.log(query.findOne({ me: "you" }));
