'use strict';

/** A refusal the app gives. Services throw these; the error middleware turns them into problem+json. */
class DomainError extends Error {
  constructor(status, type, title, detail) {
    super(detail);
    this.status = status;
    this.type = type;
    this.title = title;
  }

  /** Extra fields for this refusal's answer (none by default). */
  extras() {
    return {};
  }
}

class ValidationError extends DomainError {
  /** @param errors [{ field, message }] */
  constructor(errors) {
    super(400, '/errors/validation', 'Invalid request', 'The request is not valid');
    this.errors = errors;
  }

  extras() {
    return { errors: this.errors };
  }
}

class NoSuchVenue extends DomainError {
  constructor(venue) {
    super(404, '/errors/no-such-venue', 'No such venue', `There is no venue ${venue}`);
  }
}

class NoSuchGround extends DomainError {
  constructor(ground) {
    super(404, '/errors/no-such-ground', 'No such ground', `This venue has no ground ${ground}`);
  }
}

class NoSuchEventType extends DomainError {
  constructor(code) {
    super(400, '/errors/no-such-event-type', 'No such event type', `There is no event type ${code}`);
  }
}

class NoSuchBooking extends DomainError {
  constructor(id) {
    super(404, '/errors/no-such-booking', 'No such booking', `There is no booking ${id}`);
  }
}

/** A valid body asking for an impossible interval. When it is about the ground's hours, it says them. */
class BadInterval extends DomainError {
  constructor(detail, hours = null) {
    super(400, '/errors/bad-interval', 'Bad interval', detail);
    this.hours = hours;
  }

  extras() {
    return this.hours ? { opens: this.hours.opens, closes: this.hours.closes } : {};
  }
}

module.exports = {
  DomainError, ValidationError, NoSuchVenue, NoSuchGround, NoSuchEventType, NoSuchBooking, BadInterval,
};