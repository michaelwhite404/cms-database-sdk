declare module "sync-fetch" {
  import { RequestInfo, BodyInit, HeadersInit } from "node-fetch";
  interface RequestInit {
    method?: string;
    body?: BodyInit;
    headers?: HeadersInit;
    credentials?: "include" | "same-origin";
    timeout?: number;
  }
  interface Response<T> {
    json(): T;
  }
  function fetch<T = any>(url: RequestInfo, init?: RequestInit): Response<T>;
  export default fetch;
}
