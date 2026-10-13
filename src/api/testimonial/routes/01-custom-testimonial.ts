export default {
  routes: [
    {
      method: 'GET',
      path: '/testimonials/featured',
      handler: 'testimonial.findAllFeatured',
      config: {},
    },
  ],
};
