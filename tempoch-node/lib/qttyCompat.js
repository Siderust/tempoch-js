'use strict';

function loadExternalQtty() {
  try {
    return require('@siderust/qtty');
  } catch {
    try {
      return require('qtty-js/qtty-node');
    } catch {
      return null;
    }
  }
}

const externalQtty = loadExternalQtty();

const TIME_UNITS_IN_DAYS = {
  Millisecond: 1 / 86_400_000,
  Second: 1 / 86_400,
  Minute: 1 / 1_440,
  Hour: 1 / 24,
  Day: 1,
  Week: 7,
  JulianYear: 365.25,
  JulianCentury: 36_525,
};

class Quantity {
  constructor(value, unit) {
    if (!Number.isFinite(value)) {
      throw new Error('Quantity value must be finite');
    }
    if (!(unit in TIME_UNITS_IN_DAYS)) {
      throw new Error(`Unsupported time unit: ${unit}`);
    }
    this._value = value;
    this._unit = unit;
  }

  get value() {
    return this._value;
  }

  get unit() {
    return this._unit;
  }

  get dimension() {
    return 'Time';
  }

  to(unit) {
    return new Quantity(convert(this._value, this._unit, unit), unit);
  }

  toString() {
    return `${this._value} ${this._unit}`;
  }
}

function convert(value, fromUnit, toUnit) {
  if (!Number.isFinite(value)) {
    throw new Error('Quantity value must be finite');
  }
  if (!(fromUnit in TIME_UNITS_IN_DAYS)) {
    throw new Error(`Unsupported time unit: ${fromUnit}`);
  }
  if (!(toUnit in TIME_UNITS_IN_DAYS)) {
    throw new Error(`Unsupported time unit: ${toUnit}`);
  }

  const days = value * TIME_UNITS_IN_DAYS[fromUnit];
  return days / TIME_UNITS_IN_DAYS[toUnit];
}

function quantityDimension(quantity) {
  if (typeof quantity?.dimension === 'string') {
    return quantity.dimension;
  }

  if (typeof quantity?.unit === 'string' && quantity.unit in TIME_UNITS_IN_DAYS) {
    return 'Time';
  }

  return undefined;
}

module.exports = {
  Quantity: externalQtty?.Quantity ?? Quantity,
  convert: externalQtty?.convert ?? convert,
  quantityDimension,
};
