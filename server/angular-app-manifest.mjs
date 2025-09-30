
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://androixus.github.io/calculate_your_share/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/calculate_your_share"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 481, hash: 'e4517490dfb496b5000be61f4528fc663663448600643ef2904ec7df876de30a', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 994, hash: '7a40303be4c93153770348130355e3d87c0524fbe56ec05d8931d672613c8d60', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 21541, hash: '8bb00c518d5317d21398cbe4d09e0b1aa2a5ece58291bdf33056080728e0a3e8', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
