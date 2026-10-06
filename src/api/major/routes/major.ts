import { factories } from '@strapi/strapi';
export default factories.createCoreRouter('api::major.major', { only: ['find', 'findOne'] });
