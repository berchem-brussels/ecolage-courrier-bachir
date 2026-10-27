/** Montage des ressources métier, toutes sur la même fabrique (routes/crud.js). */
const S = require('../schemas');
const { crudRouter } = require('./crud');
const entities = require('../services/entities');
const orgServices = require('../services/org-services');
const types = require('../services/mail-types');
const contacts = require('../services/contacts');
const mails = require('../services/mails');

const RESOURCES = {
  '/api/entities': crudRouter({ resource: 'entities', schemas: { list: S.entityList, create: S.entityCreate, update: S.entityUpdate },
    list: entities.listEntities, get: entities.getEntity, create: entities.createEntity, update: entities.updateEntity, cancel: entities.deactivateEntity }),
  '/api/registers': crudRouter({ resource: 'registers', schemas: { list: S.registerList, create: S.registerCreate, update: S.registerUpdate },
    list: entities.listRegisters, get: entities.getRegister, create: entities.createRegister, update: entities.updateRegister, cancel: entities.deactivateRegister }),
  '/api/services': crudRouter({ resource: 'services', schemas: { list: S.serviceList, create: S.serviceCreate, update: S.serviceUpdate, cancel: S.cancelReason }, ...orgServices }),
  '/api/mail-types': crudRouter({ resource: 'mail-types', schemas: { list: S.typeList, create: S.typeCreate, update: S.typeUpdate, cancel: S.cancelReason }, ...types }),
  '/api/contacts': crudRouter({ resource: 'contacts', schemas: { list: S.contactList, create: S.contactCreate, update: S.contactUpdate, cancel: S.cancelReason }, ...contacts }),
  '/api/mails': crudRouter({ resource: 'mails', schemas: { list: S.mailList, create: S.mailCreate, update: S.mailUpdate, cancel: S.cancelReason }, ...mails }),
};

module.exports = { RESOURCES };
