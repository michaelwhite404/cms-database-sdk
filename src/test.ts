import { model, Query } from "mongoose";
import init from "./index";
import Item from "./interfaces/itemInterfaces";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODI1ZDhhNmEyMzQwNjlkY2RjMWFiYyIsImlhdCI6MTYyMDE0MzQ2NywiZXhwIjoxNjUxNjc5NDY3fQ.ezSf7wahKljsf-S411fZ7K0ZnIKXccvs4ELYzMK_tq8";
console.log(process.env.CMSTOKEN);
const api = init({ token });
console.log(process.env.CMSTOKEN);
// api.getDatabaseById("60837f1c774a7f66e03f4f27").then((d) => console.log(d));

// api.createDatabase({ name: "YOU" }).catch((err) => console.log(err));

// api.createItem<Item>("60837f1c774a7f66e0", {
//   _id: "43t4r4",
//   database: 3,
// });

interface TestItem extends Item {
  "business-name": string;
  color: string;
  slug: string;
  /** A rating */
  rating: number;
}

// api.createCollectionField(
//   "6085aac7cb7ffb1780d6a9a2",
//   {
//     required: false,
//     name: "Email Address",
//     type: "Email",
//   },
//   (err, field) => {
//     if (err) {
//       console.log("An Error");
//       return console.log(err);
//     }
//     console.log("It worked");
//     console.log(field);
//   }
// );

// const query = new Query<TestItem>();
// query.find({ color: 2 }).where("b").gt(2).select("color");
// // query.getFilter();

// console.log(query);
