import ExtendableError from "es6-error";

export default class CMSError extends ExtendableError {}

export const buildRequiredArgError = (name: string) =>
  new CMSError(`Argument '${name}' is required but was not present`);
