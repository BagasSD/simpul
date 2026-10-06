import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::hero-slider.hero-slider', () => ({
  async find(ctx) {
    const currentFilters = ctx.query.filters;
    const filters =
      currentFilters && typeof currentFilters === 'object' && !Array.isArray(currentFilters)
        ? currentFilters
        : {};

    // Landing page hanya menampilkan slider aktif jika caller tidak menentukan filter.
    if (!Object.prototype.hasOwnProperty.call(filters, 'is_active')) {
      ctx.query.filters = { ...filters, is_active: { $eq: true } };
    }

    return super.find(ctx);
  },
}));
