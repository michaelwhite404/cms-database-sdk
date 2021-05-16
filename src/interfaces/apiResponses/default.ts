export interface Headers {
  Accept: string;
  Authorization: string;
  "accept-version": string;
  "Content-Type": string;
}

export interface MultipleResultsReponse {
  results: number;
  page: number;
  limit: number;
}
export interface APIGenericResponse {
  status: "success";
  message: "string";
}
