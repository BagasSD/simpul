import { factories } from '@strapi/strapi';
export default factories.createCoreRouter('api::company-role.company-role', { only: ['find', 'findOne'] });
