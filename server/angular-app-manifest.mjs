
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
    'index.csr.html': {size: 485, hash: '7c4e8f35f1476ed73d6978b2263faf85e8b9562c092a076e4dcf0a9c0f514d67', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 998, hash: 'd9b54d8f94919ffbbf9c0587a42e9c459e06da02153538e39a281fe61ad1e54e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 21545, hash: '4cba34139b047be6ac3d2eb7699a022b41a1d3d7f7f385a0ddd399ccd7473979', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
