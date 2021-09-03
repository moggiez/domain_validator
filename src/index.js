"use strict";

const { Handler } = require("./handler");

exports.handler = async function (event, context, callback) {
  const handler = new Handler(event, callback);
  const isPreview = "mode" in event && event["mode"] === "preview";
  console.log("Is in preview mode:", isPreview);
  await handler.handle(isPreview);
};
