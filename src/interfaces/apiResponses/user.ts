import User from "../userInterface";

export interface APIUserResponse {
  status: "success";
  user: User;
}
