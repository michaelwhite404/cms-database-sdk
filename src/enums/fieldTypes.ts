/** Array of valid collection field types */
const fieldTypes = [
  "Bool",
  "Color",
  "Date",
  "Email",
  "Phone",
  "ImageRef",
  "ItemRef",
  "ItemRefMulti",
  "Link",
  "Number",
  "Option",
  "PlainText",
  "RichText",
  "Video",
  "User",
] as const;

export default fieldTypes;
