const express = require("express");
const { default: mongoose } = require("mongoose");
const route = require("../src/route/routes.js");
require('dotenv').config();
const { MONGODB_CONNECT , PORT } = process.env;

const app = express();
// mongoose.set()
app.use(express.json());

mongoose.set('strictQuery', true)

mongoose
  .connect(
        MONGODB_CONNECT,
    { useNewUrlParser: true}
  )
  .then(() => {
    console.log("Server connected with Mongodb");
  })
  .catch((error) => {
    console.log("Error while connecting to the database:", error.message);
  });

app.use("/", route);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
