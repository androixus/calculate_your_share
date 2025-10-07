
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
    'index.csr.html': {size: 454, hash: 'ef206fce44b59a706d10954f4bb9df34fb1dd6efde4388d25ed8996d122275ef', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 967, hash: '29d8ebfac81614c188f30647a998cb3aed7fecb775bb80301397cf1b7ec0a75a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 21514, hash: '9fdec208427023e29a584ea225b894399140b9e232645a0d35f60fda49585784', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
