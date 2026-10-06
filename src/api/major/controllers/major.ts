import { factories } from '@strapi/strapi';

const UID = 'api::major.major';

export default factories.createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    const response = await super.find(ctx);
    const majorIds = response.data.map((major) => major.id);

    if (majorIds.length === 0) return response;

    const majorsWithCompanies = await strapi.db.query(UID).findMany({
      where: { id: { $in: majorIds } },
      select: ['id'],
      populate: { companies: { select: ['id'] } },
    });
    const companyCounts = new Map(
      majorsWithCompanies.map((major) => [major.id, major.companies?.length ?? 0]),
    );

    response.data = response.data.map((major) => ({
      ...major,
      companies_count: companyCounts.get(major.id) ?? 0,
    }));

    return response;
  },
}));
