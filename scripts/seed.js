const { compileStrapi, createStrapi } = require('@strapi/strapi');

const SEED = {
  majors: [
    { code: 'RPL', name: 'Rekayasa Perangkat Lunak', description: 'Data contoh jurusan untuk demonstrasi.' },
    { code: 'AKL', name: 'Akuntansi dan Keuangan Lembaga', description: 'Data contoh jurusan untuk demonstrasi.' },
    { code: 'PM', name: 'Pemasaran', description: 'Data contoh jurusan untuk demonstrasi.' },
  ],
  roles: [
    { title: 'Web Developer', description: 'Membantu pengembangan dan pengujian aplikasi web.' },
    { title: 'Staf Administrasi', description: 'Membantu pencatatan dan pengelolaan dokumen.' },
    { title: 'Staf Pemasaran', description: 'Membantu menyiapkan materi dan aktivitas pemasaran.' },
  ],
  company: {
    name: 'Mitra Contoh SIMPUL',
    description: 'Mitra simulasi untuk mencoba fitur SIMPUL. Ganti atau hapus data ini sebelum digunakan untuk informasi nyata.',
    address: 'Alamat contoh, Bandung, Jawa Barat',
    distance_note: 'Data lokasi simulasi',
    quota_status: 'Tersedia',
    rating: 4.5,
    working_hours: [
      { shift_name: 'Hari kerja', working_hours_text: 'Senin–Jumat, 08.00–16.00 WIB' },
    ],
    requirements: ['Surat pengantar sekolah', 'Curriculum vitae'],
    facilities: ['Pembimbing lapangan', 'Akses internet'],
    contact_info: {
      email: 'mitra@example.com',
      phone: '000-0000-0000',
      whatsapp: '6280000000000',
    },
  },
  placements: [
    { roleTitle: 'Web Developer', responsibilities: ['Membantu membuat halaman web', 'Menguji fitur aplikasi'] },
    { roleTitle: 'Staf Administrasi', responsibilities: ['Membantu mengarsipkan dokumen', 'Mencatat data administrasi'] },
    { roleTitle: 'Staf Pemasaran', responsibilities: ['Membantu menyiapkan materi promosi', 'Mendukung pencatatan kegiatan pemasaran'] },
  ],
  testimonial: {
    student_name: 'Siswa Contoh',
    school_name: 'Sekolah Contoh',
    quote: 'Testimoni simulasi untuk melihat tampilan data. Ganti dengan testimoni yang sudah mendapat izin publikasi.',
  },
  heroSlider: {
    title: 'Temukan Tempat PKL yang Tepat',
    subtitle: 'Jelajahi mitra dan posisi magang sesuai jurusanmu.',
    cta_text: 'Lihat Mitra',
    cta_link: '/companies',
    sort_order: 1,
    is_active: true,
  },
  appInfo: {
    title: 'Tentang SIMPUL',
    app_full_name: 'Sistem Informasi Magang & Pilihan Untuk Lapangan',
    content: 'SIMPUL membantu siswa menemukan informasi tempat Praktik Kerja Lapangan. Konten ini adalah data contoh.',
  },
};

const UIDS = {
  major: 'api::major.major',
  role: 'api::role.role',
  company: 'api::company.company',
  companyRole: 'api::company-role.company-role',
  testimonial: 'api::testimonial.testimonial',
  heroSlider: 'api::hero-slider.hero-slider',
  appInfo: 'api::app-info.app-info',
};

async function createIfMissing(strapi, uid, filters, data, label) {
  const existing = await strapi.documents(uid).findFirst({ filters });
  if (existing) {
    console.log(`Lewati (sudah ada): ${label}`);
    return existing;
  }

  const created = await strapi.documents(uid).create({ data });
  console.log(`Dibuat: ${label}`);
  return created;
}

async function seed(strapi) {
  const majors = new Map();
  for (const major of SEED.majors) {
    majors.set(major.code, await createIfMissing(
      strapi,
      UIDS.major,
      { code: { $eq: major.code } },
      major,
      `jurusan ${major.code}`,
    ));
  }

  const roles = new Map();
  for (const role of SEED.roles) {
    roles.set(role.title, await createIfMissing(
      strapi,
      UIDS.role,
      { title: { $eq: role.title } },
      role,
      `role ${role.title}`,
    ));
  }

  const company = await createIfMissing(
    strapi,
    UIDS.company,
    { name: { $eq: SEED.company.name } },
    SEED.company,
    `perusahaan ${SEED.company.name}`,
  );

  await strapi.documents(UIDS.company).update({
    documentId: company.documentId,
    data: {
      majors: { connect: [...majors.values()].map((major) => major.documentId) },
    },
  });

  for (const placement of SEED.placements) {
    const role = roles.get(placement.roleTitle);
    const filters = {
      company: { documentId: { $eq: company.documentId } },
      role: { documentId: { $eq: role.documentId } },
    };

    await createIfMissing(
      strapi,
      UIDS.companyRole,
      filters,
      {
        company: { connect: [company.documentId] },
        role: { connect: [role.documentId] },
        responsibilities: placement.responsibilities,
      },
      `posisi ${placement.roleTitle}`,
    );
  }

  await createIfMissing(
    strapi,
    UIDS.testimonial,
    { student_name: { $eq: SEED.testimonial.student_name }, company: { documentId: { $eq: company.documentId } } },
    { ...SEED.testimonial, company: { connect: [company.documentId] } },
    'testimoni contoh',
  );

  await createIfMissing(
    strapi,
    UIDS.heroSlider,
    { title: { $eq: SEED.heroSlider.title } },
    SEED.heroSlider,
    'hero slider contoh',
  );

  const appInfo = await strapi.documents(UIDS.appInfo).findFirst();
  if (appInfo) {
    console.log('Lewati (sudah ada): app info');
  } else {
    await strapi.documents(UIDS.appInfo).create({ data: SEED.appInfo });
    console.log('Dibuat: app info');
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeder contoh tidak boleh dijalankan di NODE_ENV=production.');
  }

  const context = await compileStrapi({ appDir: process.cwd() });
  const strapi = createStrapi(context);

  try {
    await strapi.load();
    await seed(strapi);
    console.log('Seeder selesai. Jalankan ulang dengan aman; data yang sudah ada akan dilewati.');
  } finally {
    await strapi.destroy();
  }
}

main().catch((error) => {
  console.error('Seeder gagal:', error);
  process.exitCode = 1;
});
