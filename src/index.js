"use strict";

const { Handler } = require("./handler");

exports.handler = async function (event, context, callback) {
  const handler = new Handler(event, callback);
  await handler.handle();
};
