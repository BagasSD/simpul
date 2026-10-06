import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::company.company', {
  only: ['find', 'findOne'], // read-only: tidak ada create/update/delete lewat API
  config: {
    find: { middlewares: ['api::company.default-populate'] },
    findOne: { middlewares: ['api::company.default-populate'] },
  },
});
