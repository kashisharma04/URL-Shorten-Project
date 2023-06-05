const express = require("express");
const Router = express.Router();
const urlModel = require("../controller/control");

Router.post("/url/shorten", urlModel.shortUrl);
Router.get("/:urlCode", urlModel.getUrl);
Router.use("*", (req, res) => {
  return res.status(404).send("invalid urls");
});
module.exports = Router;
