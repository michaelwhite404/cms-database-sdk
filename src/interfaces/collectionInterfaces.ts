import { ObjectId } from "mongodb";
import fieldTypes from "../enums/fieldTypes";
import { APIDeletedCollectionResponse } from "./apiResponses/collection";

export interface CollectionField {
  /** Auto-generated ObjectId */
  _id: string | ObjectId;
  /** The name of the collection field */
  name: string;
  /** The type of collection field */
  type: CollectionFieldType;
  /** Unique slug identifier for the field */
  slug: string;
  /** Shows whether the field is a required field */
  required: boolean;
  /** Shows whether the user can edit the field */
  editable: boolean;
  /** Validations an item field must adhere to */
  validations?: CollectionValidations;
  /** Human readable text that describes the field */
  helpText?: string;
  /** Denotes field is a primary field (only one allowed) */
  primary?: boolean;
}

export interface CollectionValidations {
  /** The maximum length a valid string can be */
  maxLength?: number;
  /** The minimum length a vaild string can be */
  minLength?: number;
  /** The highest number a valid number can be  */
  maximum?: number;
  /** The lowest number a valid number can be  */
  minimum?: number;
  /** The maximum size of a file */
  maxSize?: number;
  /** Highest amount of decimal places a number can go */
  decimalPlaces?: number;
  /** Should the string only be on a single line */
  singleLine?: boolean;
  /** Array of options in a collection a user can pick from */
  options?: CollectionValidationOption[] | string[];
  /** Whether the format of the number is an integer or decimal */
  format?: "integer" | "decimal";
  precision?: number;
  /** Can the number be a negative number */
  allowNegative?: boolean;
  /** Collecton ID for fields that reference another collection */
  collectionId?: string;
  pattern?: RegExp;
}

export default interface Collection {
  /** Auto-generated ObjectId of the collection */
  _id: string;
  /** The name of the collection */
  name: string;
  /** The name of the collection in singular form (e.g. "Blog Posts" -> "Blog Post") */
  singularName: string;
  /** The database the collection is added to */
  database: string | ObjectId;
  /** The date the collection was created (Immutable) */
  createdAt: Date;
  /** The date the collection was last created (Not editable by user) */
  lastUpdated: Date;
  /** Unique slug identifier for the collection */
  slug: string;
  /** A custom ID for the collection */
  shortId: string;
  /** The user who created the collection */
  createdBy: string;
  /** The user who last updated collection */
  updatedBy: string;
  /** An array of a collection's fields */
  fields: CollectionField[];
}

export interface CollectionValidationOption {
  /** ID of the option */
  _id: string | ObjectId;
  /** Name of the option */
  name: string;
}

export type BasicCollectionInfo = Pick<
  Collection,
  "_id" | "name" | "slug" | "createdAt" | "lastUpdated" | "singularName"
>;

export interface CollectionData {
  /** The name of the collection being created */
  name: string;
  /** The unique slug of the collection */
  slug?: string;
  /**
   * An array of collection fields. Each collection field must have a `name` and `type`.
   *
   * Example:
   *
   *      fields: [
   *        {
   *          type: "Color",
   *          name: "Color"
   *        },
   *        {
   *          name: "Business Name",
   *          type: "PlainText",
   *          primaryName: true,
   *        },
   *        {
   *          type: "Bool",
   *          name: "Featured?",
   *          helpText: "Should this business be featured?"
   *        },
   *        {
   *          name: "Rating",
   *          type: "Number",
   *          required: true,
   *          validations: {
   *             allowNegative: false,
   *             format: "integer",
   *             maximum: 5
   *          }
   *        }
   *      ]
   */
  fields: CollectionDataFields[];
}

export interface CollectionDataFields {
  /** The type of collection field  */
  type: CollectionFieldType;
  /** The name of the collection field */
  name: string;
  /**
   * Set to true if this field will be a required field
   * @default false
   */
  required?: boolean;
  /** Validations an item field must adhere to */
  validations?: CollectionValidations;
  /** Human readable text that describes the collection field */
  helpText?: string;
  /**
   * Set to true if this field will be the primary name field. There can only be
   * one primary name collection field
   * @default false
   */
  primaryName?: boolean;
  /**
   * Set to true if this field will be the primary slug field. There can only be
   * one primary slug collection field
   * @default false
   */
  primarySlug?: boolean;
}

type CollectionFieldType = typeof fieldTypes[number];

export type UpdateableCollectionProps = Pick<Collection, "name" | "slug">;

export type DeletedCollectionResponse = Omit<APIDeletedCollectionResponse, "status">;

export type APIDeletedCollectionFieldResponse = { status: "success"; fieldDeleted: true };

export type DeletedCollectionFieldResponse = Omit<APIDeletedCollectionFieldResponse, "status">;
