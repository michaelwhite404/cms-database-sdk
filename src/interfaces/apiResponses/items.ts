import Item from "../itemInterfaces";
import { MultipleResultsReponse } from "./default";

export interface APIItemsResponse extends MultipleResultsReponse {
  status: "success";
  items: Item[];
}

export interface APIItemResponse extends MultipleResultsReponse {
  status: "success";
  item: Item;
}
