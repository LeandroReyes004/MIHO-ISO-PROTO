import { onRequest } from './functions/suwayomi/[[path]].js';

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/suwayomi' || url.pathname.startsWith('/suwayomi/')) {
      const rest = url.pathname.slice('/suwayomi'.length).replace(/^\//, '');
      return onRequest({ request, env, params: { path: rest.split('/') } });
    }
    return env.ASSETS.fetch(request);
  },
};
