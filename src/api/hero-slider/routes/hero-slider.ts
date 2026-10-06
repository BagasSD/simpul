import { factories } from '@strapi/strapi';
export default factories.createCoreRouter('api::hero-slider.hero-slider', { only: ['find', 'findOne'] });
