import type { Core } from '@strapi/strapi';

// Content type yang boleh dibaca publik (find + findOne)
const COLLECTIONS = ['company', 'major', 'role', 'company-role', 'testimonial', 'hero-slider'];
// Single type hanya punya "find"
const SINGLES = ['app-info'];

export default {
  register() {},

  /**
   * Saat Strapi start, otomatis memberi izin READ-ONLY ke role "Public".
   * Jadi tidak perlu klik manual di Settings > Users & Permissions.
   * Create/Update/Delete TIDAK dibuka -> hanya bisa lewat Admin Panel.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });
    if (!publicRole) return;

    const actions = [
      ...COLLECTIONS.flatMap((n) => [`api::${n}.${n}.find`, `api::${n}.${n}.findOne`]),
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
