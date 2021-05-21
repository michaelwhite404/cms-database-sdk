import { ObjectId } from "mongodb";

export default interface User {
  _id: string | ObjectId;
  email: string;
  firstName: string;
  lastName: string;
}
