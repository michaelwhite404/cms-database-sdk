export type FinalQuery = Omit<QueryFeatures<any>, "fields"> & { fields?: string };
export interface QueryFeatures<T> {
  /**
   * @param page The paginated page of the results
   * @default 1
   */
  page?: number;
  /**
   * @param limit The number of results the response is limited to
   * @default 100
   */
  limit?: number;
  /**
   * @param sort The field(s) that set the sort order of the results
   */
  sort?: string;
  /** @param fields An array of fields each result will limit itself to  */
  fields?: Array<keyof T>;
}
