import fetch from "sync-fetch";
import { APICollectionResponse } from "./interfaces/apiResponses/collection";
import Collection from "./interfaces/collectionInterfaces";
import Item from "./interfaces/itemInterfaces";

interface TestItem extends Item {
  "business-name": string;
  color: string;
  slug: string;
  /** A rating */
  rating: number;
}
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODI1ZDhhNmEyMzQwNjlkY2RjMWFiYyIsImlhdCI6MTYyMDE0MzQ2NywiZXhwIjoxNjUxNjc5NDY3fQ.ezSf7wahKljsf-S411fZ7K0ZnIKXccvs4ELYzMK_tq8";

class Model<T> {
  constructor(doc?: any) {}

  static modelName: string;
  static collection_id: string;
  static schema: any;
  static create() {}
  static deleteMany() {}
  static deleteOne() {}
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
  then(): T {
    return {} as T;
  }
}

function model<T extends Item>(collection_id: string) {
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

  return Model;
}

const Post = model<TestItem>("60cdc74497564961fc2035e7");
console.log(Post);

const post = Post.create();

const m = new Post();
