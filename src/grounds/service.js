'use strict';
const { NoSuchVenue, NoSuchGround } = require('../errors');

/** A ground as the API shows it: its code as `ground`, its name and its hours. */
function shapeGround(g) {
  return {
    ground: g.code, name: g.name, opens: g.opens, closes: g.closes, sundayOpens: g.sundayOpens, sundayCloses: g.sundayCloses,
  };
}

/** Sunday has its own hours; every other day the weekday ones. Dates are read in UTC. */
function hoursOn(g, date) {
  const sunday = new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
  return sunday ? { opens: g.sundayOpens, closes: g.sundayCloses } : { opens: g.opens, closes: g.closes };
}

function makeGroundService({ repository, clock }) {
  async function requireVenue(venue) {
    if (!(await repository.venueExists(venue))) throw new NoSuchVenue(venue);
  }

  /** The venue's grounds, A to D, each with its weekday and Sunday hours. */
  async function grounds(venue) {
    await requireVenue(venue);
    return { venue, grounds: (await repository.groundsOf(venue)).map(shapeGround) };
  }

  /** The event types with their setup and teardown buffers. */
  async function eventTypes(venue) {
    await requireVenue(venue);
    const types = await repository.eventTypesOf(venue);
    return {
      eventTypes: types.map((t) => ({
        code: t.code, name: t.name, setupMinutes: t.setupMinutes, teardownMinutes: t.teardownMinutes,
      })),
    };
  }

  /** One ground's day: its hours on that weekday, and its bookings. No date means today by the clock, in UTC. */
  async function day(venue, code, date) {
    await requireVenue(venue);
    const g = await repository.ground(venue, code);
    if (!g) throw new NoSuchGround(code);
    const on = date || clock.now().toISOString().slice(0, 10);
    return { venue, ground: code, date: on, ...hoursOn(g, on), bookings: [] };
  }

  return { grounds, eventTypes, day };
}

module.exports = { makeGroundService };