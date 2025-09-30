
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://github.com/androixus/calculate_your_share.git',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/androixus/calculate_your_share.git"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 485, hash: 'c436c29bea1380c22134edd8db9fe2ab6d57f14359566739ec4e7a7648fd48b7', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 998, hash: 'e544a6d015dbdfeea8697bff9e02aeb69b028b43fcecc2bdc7ec9818f3b3a083', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 21545, hash: 'f113aedd7c69f04fd2974c85dd5cb4c0adb3384d355bec583aca36baed3e7891', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
