'use strict';

/** The real clock, on the complex's time: India (UTC+05:30). Everything else asks the clock it was given, so a test can pass one it controls. */
const INDIA_OFFSET_MS = 330 * 60 * 1000;

const systemClock = {
  now: () => new Date(Date.now() + INDIA_OFFSET_MS),
};

module.exports = { systemClock };