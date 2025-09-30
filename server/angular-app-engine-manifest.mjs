
export default {
  basePath: 'https://androixus.github.io/calculate_your_share',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
