import type { Core } from '@strapi/strapi';

// Content type yang boleh dibaca publik (find + findOne)
const COLLECTIONS = ['company', 'major', 'role', 'company-role', 'testimonial', 'hero-slider', 'business-field'];
// Single type hanya punya "find"
const SINGLES = ['app-info'];

export default {
  register() {},

  /**
   * Saat Strapi start, otomatis memberi izin baca publik dan create testimonial.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });
    if (!publicRole) return;

    const actions = [
      ...COLLECTIONS.flatMap((n) => [`api::${n}.${n}.find`, `api::${n}.${n}.findOne`]),
      'api::testimonial.testimonial.create',
      'api::testimonial.testimonial.findAllFeatured',
      ...SINGLES.map((n) => `api::${n}.${n}.find`),
    ];

    const permissionQuery = strapi.db.query('plugin::users-permissions.permission');
    for (const action of actions) {
      const exists = await permissionQuery.findOne({ where: { action, role: publicRole.id } });
      if (!exists) {
        await permissionQuery.create({ data: { action, role: publicRole.id } });
      }
    }
  },
};
