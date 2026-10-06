import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::company.company', () => ({
  async find(ctx) {
    const { major, role, search } = ctx.query;
    delete ctx.query.major;
    delete ctx.query.role;
    delete ctx.query.search;

    const searchTerm = typeof search === 'string' ? search.trim() : '';

    if (major || role || searchTerm) {
      const currentFilters = ctx.query.filters;
      const filters: Record<string, any> =
        currentFilters && typeof currentFilters === 'object' && !Array.isArray(currentFilters)
          ? { ...currentFilters }
          : {};

      if (major) {
        const majorFilters = filters.majors ?? {};
        filters.majors = {
          ...majorFilters,
          documentId: { ...(majorFilters.documentId ?? {}), $eq: major },
        };
      }

      if (role) {
        // Company exposes this relation as `roles`; the linked Company Role's field is `role`.
        const rolesFilters = filters.roles ?? {};
        const companyRoleFilters = rolesFilters.role ?? {};
        filters.roles = {
          ...rolesFilters,
          role: {
            ...companyRoleFilters,
            documentId: { ...(companyRoleFilters.documentId ?? {}), $eq: role },
          },
        };
      }

      if (searchTerm) {
        const searchFilters = [
          { name: { $containsi: searchTerm } },
          { majors: { name: { $containsi: searchTerm } } },
          { roles: { role: { title: { $containsi: searchTerm } } } },
        ];

        if (filters.$or || Array.isArray(filters.$and)) {
          const andFilters = Array.isArray(filters.$and) ? [...filters.$and] : [];
          if (filters.$or) andFilters.push({ $or: filters.$or });
          delete filters.$or;
          andFilters.push({ $or: searchFilters });
          filters.$and = andFilters;
        } else {
          filters.$or = searchFilters;
        }
      }

      ctx.query.filters = filters;
    }

    return super.find(ctx);
  },
}));
