const express = require("express");
const urlModel = require("../models/urlModel");
const validUrl = require("valid-url");
const shortId = require("shortid");
const redis = require("redis");
require('dotenv').config();
const {host , password} = process.env

const { promisify } = require("util");

const client = redis.createClient({
  host: host,
  port: 18137,
  password: password,
});

client.on("error", console.error);
client.on("connect", () => console.log("Connected to Redis"));

const setCache = promisify(client.SET).bind(client);
const getCache = promisify(client.GET).bind(client);

//=========================================SHORT URL===================================================
const shortUrl = async (req, res) => {
  try {
    const longUrl = req.body.longUrl;

    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide a URL" });
    }

    if (!validUrl.isWebUri(longUrl)) {
      return res.status(400).send({ status: false, message: "Invalid URL" });
    }

    const localCheck = await urlModel.findOne({ shortUrl: longUrl });

    if (localCheck) {
      return res
        .status(400)
        .send({ status: false, msg: "This URL is already shorted" });
    }

    const baseUrl = "http://localhost:3000/";

    let getDataCache = await getCache(longUrl);
    getDataCache = JSON.parse(getDataCache);

    if (getDataCache) {
      return res.status(200).send({
        status: true,
        message: "URL exists in cache",
        data: getDataCache,
      });
    }

    const urlExists = await urlModel.findOne({ longUrl }, { _id: 0, __v: 0 });

    if (urlExists) {
      await setCache(longUrl, JSON.stringify(urlExists), "EX", 86400);
      return res.status(200).send({
        status: true,
        message: "URL exists in database",
        data: urlExists,
      });
    }

    const urlCode = shortId.generate();
    const shortUrl = `${baseUrl}${urlCode}`;

    const data = await urlModel.create({ longUrl, shortUrl, urlCode });

    const { _id, __v, ...Data } = data._doc;

    //set cache
    await setCache(longUrl, JSON.stringify(Data), "EX", 86400);

    return res.status(201).send({ status: true, data: Data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//===========================GO TO ORIGINAL URL========================================================
const getUrl = async (req, res) => {
  try {
    const urlCode = req.params.urlCode;

    let getDataCache = await getCache(urlCode);

    if (getDataCache) {
      const url = JSON.parse(getDataCache);
      return res.status(302).redirect(url.longUrl);
    }

    const url = await urlModel.findOne({ urlCode }, { _id: 0, __v: 0 });

    if (!url) {
      return res.status(404).send({
        status: false,
        message: `URL not found with the code ${urlCode}`,
      });
    }

    await setCache(urlCode, JSON.stringify(url), "EX", 86400);
    return res.status(303).redirect(url.longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { shortUrl, getUrl };
