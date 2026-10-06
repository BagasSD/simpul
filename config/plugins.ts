export default ({ env }) => {
  const provider = env('UPLOAD_PROVIDER', 'local');

  if (provider !== 'cloudinary') return {};

  const folder = env('CLOUDINARY_FOLDER_NAME', 'simpul');

  return {
    upload: {
      config: {
        provider: 'cloudinary',
        providerOptions: {
          cloud_name: env('CLOUDINARY_NAME'),
          api_key: env('CLOUDINARY_KEY'),
          api_secret: env('CLOUDINARY_SECRET'),
        },
        actionOptions: {
          upload: { folder },
          uploadStream: { folder },
          delete: {},
        },
      },
    },
  };
};
