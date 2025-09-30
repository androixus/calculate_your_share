
export default {
  basePath: 'https://github.com/androixus/calculate_your_share.git',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
