/**
 * Validation des entrées par ajv (patron SAGA validation.js).
 * additionalProperties:false sur tout schéma : un champ inconnu est refusé (mass assignment).
 */
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { fail } = require('./envelope');

const ajv = new Ajv({ coerceTypes: true, allErrors: true, strict: false, useDefaults: true });
addFormats(ajv);

const T = {
  str: (max = 500) => ({ type: ['string', 'null'], maxLength: max }),
  reqStr: (max = 500) => ({ type: 'string', minLength: 1, maxLength: max }),
  text: (max = 20000) => ({ type: ['string', 'null'], maxLength: max }),
  email: () => ({ type: 'string', format: 'email', maxLength: 200 }),
  int: (min, max) => ({ type: 'integer', ...(min !== undefined && { minimum: min }), ...(max !== undefined && { maximum: max }) }),
  en: (...vals) => ({ enum: vals }),
  bool: () => ({ type: 'boolean' }),
  date: () => ({ type: 'string', format: 'date' }),
  nullDate: () => ({ type: ['string', 'null'], anyOf: [{ format: 'date' }, { type: 'null' }] }),
};

function obj(properties, required = []) {
  return { type: 'object', properties, required, additionalProperties: false };
}

function compile(schema, where) {
  const check = ajv.compile(schema);
  const mw = function validateInput(req, res, next) {
    const target = req[where] || {};
    if (!check(target)) {
      const details = (check.errors || []).slice(0, 6).map((e) => {
        const field = (e.instancePath || '').replace(/^\//, '') || e.params?.missingProperty || e.params?.additionalProperty || where;
        return `${field}: ${e.message}`;
      });
      return fail(res, req, 400, 'VALIDATION', details);
    }
    next();
  };
  mw.ajvSchema = schema;
  mw.ajvWhere = where;
  return mw;
}

const validate = (schema) => compile(schema, 'body');
const validateQuery = (schema) => compile(schema, 'query');
const validateParams = (schema) => compile(schema, 'params');

const idParam = obj({ id: T.int(1) }, ['id']);

module.exports = { ajv, T, obj, validate, validateQuery, validateParams, idParam };
