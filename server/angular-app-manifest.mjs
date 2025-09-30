
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/calculate_your_share/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/calculate_your_share"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 498, hash: '78253ba14f6516c53d91f892457535749903dea834025d9d2e1ae11b9ef2ee6d', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: '907d33c110ac0e1579a5594f95199b49f6fcc3e4d8eafaf298b11e1213379495', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 21558, hash: '2befa89407417fe646dcaa9bd90dc30a9af96e3f6417023f502de5ce99079821', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
