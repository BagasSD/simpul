/**
 * Otomatis menyertakan semua relasi/gambar pada GET /api/companies
 * supaya frontend tidak perlu menulis populate yang panjang.
 * Jika frontend mengirim ?populate=... sendiri, middleware ini diabaikan.
 */
export default (_config: unknown, _opts: unknown) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    if (!ctx.query.populate) {
      ctx.query = {
        ...ctx.query,
        populate: {
          images: true,
          majors: true,
          business_fields: true,
          working_hours: true,
        },
      };
    }
    await next();
  };
};
