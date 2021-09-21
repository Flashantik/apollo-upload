export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'uploadfile',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module', 
    '@nuxtjs/vuetify',
  ],
  
  router: {
    middleware: ['auth']
  },
  
  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxtjs/apollo',
    'cookie-universal-nuxt',
    '@nuxtjs/toast'
  ],
  apollo: {
    clientConfigs: {
      default: '~/apollo/config.js'
      // $query: {
      //   deep: true,
      // },
    },
    // defaultOptions: {
    //   // apollo options applied to all queries in components
    //   deep: true,

    // },
    defaultOptions: {
      $query: {
        fetchPolicy: 'cache-and-network',
        deep: true
      }
    },
    deep: true,
    errorPolicy: 'none'
    // credentials: 'include',
    // connectToDevTools: true
  },
  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
