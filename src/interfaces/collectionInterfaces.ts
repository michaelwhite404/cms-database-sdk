export interface CollectionField {
  /** Auto-generated ObjectId */
  _id: string;
  /** The name of the collection field */
  name: string;
  /** The type of collection field */
  type: string;
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
  /** The order number of the field */
  order?: number;
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
  database: string;
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
  _id: string;
  /** Name of the option */
  name: string;
}
