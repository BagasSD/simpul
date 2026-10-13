import { factories } from '@strapi/strapi';

type Filters = Record<string, any>;

function populateCompany(ctx: any) {
  const populate = ctx.query.populate;
  if (populate === '*') return;

  const populateFields =
    populate && typeof populate === 'object' && !Array.isArray(populate)
      ? populate
      : typeof populate === 'string' && populate
        ? Object.fromEntries(populate.split(',').map((field) => [field.trim(), true]))
        : {};

  ctx.query.populate = { ...populateFields, company: true };
}

export default factories.createCoreController('api::testimonial.testimonial', () => ({
  async find(ctx) {
    populateCompany(ctx);
    return super.find(ctx);
  },

  async findAllFeatured(ctx) {
    const { company } = ctx.query;
    delete ctx.query.company;

    const currentFilters = ctx.query.filters;
    const filters: Filters =
      currentFilters && typeof currentFilters === 'object' && !Array.isArray(currentFilters)
        ? { ...currentFilters }
        : {};
    const andFilters = Array.isArray(filters.$and) ? [...filters.$and] : [];

    if (Object.prototype.hasOwnProperty.call(filters, '$and')) delete filters.$and;
    if (Object.keys(filters).length > 0) andFilters.push(filters);
    andFilters.push({ is_featured: { $eq: true } });
    if (typeof company === 'string' && company.trim()) {
      andFilters.push({ company: { documentId: { $eq: company.trim() } } });
    }

    ctx.query.filters = { $and: andFilters };
    populateCompany(ctx);
    return super.find(ctx);
  },
}));
