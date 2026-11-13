'use strict';
const { NoSuchGround, NoSuchEventType, NoSuchBooking, BadInterval, ValidationError } = require('../errors');
const { hoursOn } = require('../grounds/hours');
const { wholeSecond, iso } = require('../time');

const VENUE = 'deccan';
const MINUTE = 60 * 1000;

/** The ground is held from the setup before the event to the teardown after it. Derived on every read, never stored. */
function shadowOf(fromAt, toAt, type) {
  return {
    heldFrom: new Date(fromAt.getTime() - type.setupMinutes * MINUTE),
    heldTo: new Date(toAt.getTime() + type.teardownMinutes * MINUTE),
  };
}

/** A booking as the API shows it, with its shadow; the club's name stays inside. */
function shape(b, type) {
  const { heldFrom, heldTo } = shadowOf(b.fromAt, b.toAt, type);
  return {
    bookingId: b.bookingId, ground: b.groundId, event: b.eventTypeId, from: iso(b.fromAt), to: iso(b.toAt),
    groundHeldFrom: iso(heldFrom), groundHeldTo: iso(heldTo), state: b.state,
  };
}

/** The instant a ground's "HH:MM" falls at on a date. */
function at(date, hhmm) {
  return new Date(`${date}T${hhmm}:00Z`);
}

/**
 * The rules of an interval, after the body is valid: to after from, 30 minutes to 12 hours (a validation problem),
 * not in the past, one date, and the shadow inside the ground's hours that weekday.
 */
function checkInterval({ ground, type, now }, fromAt, toAt) {
  if (toAt <= fromAt) throw new BadInterval('The interval must end after it starts');
  const minutes = (toAt - fromAt) / MINUTE;
  if (minutes < 30 || minutes > 12 * 60) {
    throw new ValidationError([{ field: 'to', message: 'An interval lasts from 30 minutes to 12 hours' }]);
  }
  if (fromAt < now) throw new BadInterval('Nobody books the past');
  const date = iso(fromAt).slice(0, 10);
  if (iso(toAt).slice(0, 10) !== date) throw new BadInterval('The interval must start and end on the same date');
  const hours = hoursOn(ground, date);
  const { heldFrom, heldTo } = shadowOf(fromAt, toAt, type);
  if (heldFrom < at(date, hours.opens) || heldTo > at(date, hours.closes)) {
    throw new BadInterval(`With setup and teardown, the ground is held outside its hours, ${hours.opens}-${hours.closes}`, hours);
  }
}

function makeBookingService({ bookings, grounds, settings, clock }) {
  /** A club asks for a slot: a requested booking, held for HOLD_HOURS from now. */
  async function request({ ground: code, event, from, to, club }) {
    const ground = await grounds.ground(VENUE, code);
    if (!ground) throw new NoSuchGround(code);
    const type = await grounds.eventType(VENUE, event);
    if (!type) throw new NoSuchEventType(event);
    const fromAt = wholeSecond(new Date(from));
    const toAt = wholeSecond(new Date(to));
    const requestedAt = wholeSecond(clock.now());
    checkInterval({ ground, type, now: requestedAt }, fromAt, toAt);
    const holdUntil = new Date(requestedAt.getTime() + settings.holdHours * 60 * MINUTE);
    const requested = {
      bookingId: await bookings.nextId(VENUE), venueId: VENUE, groundId: code, eventTypeId: event, clubName: club, fromAt, toAt,
      state: 'requested', requestedAt, holdUntil,
    };
    await bookings.insert(requested);
    return { ...shape(requested, type), holdUntil: iso(holdUntil) };
  }

  async function booking(id) {
    const found = await bookings.byId(VENUE, id);
    if (!found) throw new NoSuchBooking(id);
    return shape(found, await grounds.eventType(VENUE, found.eventTypeId));
  }

  return { request, booking };
}

module.exports = { makeBookingService, shadowOf, shape };