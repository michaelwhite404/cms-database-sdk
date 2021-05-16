import { ObjectId } from "mongodb";

export default interface Item {
  _id: ObjectId | string;
  /** Unique slug identifier for the item */
  slug: string;
  /** The collection ID the item belongs to */
  _cid: ObjectId | string;
  /** The database ID the item belongs to */
  database: ObjectId | string;
  /** The user who created the item (Immutable)*/
  "created-by": string;
  /** The last user to update the item */
  "updated-by": string;
  /** The date the item was last updated */
  "updated-on": string | Date | number;
  /** The date the item was created (Immutable) */
  "created-on": string;
  /** Item fields created in the request body */
  fields: ItemFields;
  /** Test */
  item_id: string;
  /** Additional Fields */
  [x: string]: any;
}

export interface ItemFields {
  [props: string]: ItemField;
}

export interface ItemField {
  [field: string]: any;
}
