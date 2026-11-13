'use strict';
const mongoose = require('mongoose');

const Booking = mongoose.model('Booking', new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  venueId: { type: String, required: true },
  groundId: { type: String, required: true },
  eventTypeId: { type: String, required: true },
  clubName: { type: String, required: true },
  fromAt: { type: Date, required: true },
  toAt: { type: Date, required: true },
  state: { type: String, enum: ['requested', 'confirmed', 'cancelled', 'expired'], required: true },
  requestedAt: { type: Date, required: true },
  holdUntil: { type: Date, required: true },
}, { collection: 'bookings' }));

/** The next booking id at the venue: 'BK' and a number of at least four digits, BK0001 first. */
async function nextId(venueId) {
  const count = await Booking.countDocuments({ venueId });
  return `BK${String(count + 1).padStart(4, '0')}`;
}

async function insert(booking) {
  await Booking.create(booking);
}

function byId(venueId, bookingId) {
  return Booking.findOne({ venueId, bookingId }).lean();
}

/** A ground's bookings that start on this date (UTC), in `from` order. */
function onDay(venueId, groundId, date) {
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return Booking.find({ venueId, groundId, fromAt: { $gte: start, $lt: end } }).sort({ fromAt: 1 }).lean();
}

module.exports = { nextId, insert, byId, onDay };