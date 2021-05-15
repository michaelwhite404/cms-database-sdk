import init from "./index";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwODI1ZDhhNmEyMzQwNjlkY2RjMWFiYyIsImlhdCI6MTYyMDE0MzQ2NywiZXhwIjoxNjUxNjc5NDY3fQ.ezSf7wahKljsf-S411fZ7K0ZnIKXccvs4ELYzMK_tq8";

const api = init({ token });

// api.getDatabaseById("60837f1c774a7f66e03f4f27").then((d) => console.log(d));

// api.createDatabase({ name: "YOU" }).catch((err) => console.log(err));
