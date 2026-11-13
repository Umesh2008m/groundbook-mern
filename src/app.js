'use strict';
const express = require('express');
const groundRepository = require('./grounds/repository');
const { makeGroundService } = require('./grounds/service');
const { makeGroundRouter } = require('./grounds/router');
const { notFound, errorHandler } = require('./errors/middleware');

/** Builds the Express app. It never connects to the database and never listens: server.js and tests do that. */
function createApp({ settings, clock }) {
  const app = express();
  const grounds = makeGroundService({ repository: groundRepository, clock });

  app.use(express.json());
  app.use(makeGroundRouter(grounds));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };