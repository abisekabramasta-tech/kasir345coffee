// sheets-helper.js (client) - calls Apps Script Web App
// Uses form-encoded POST to avoid CORS preflight with Apps Script
(function(){
  // Read URL from script tag attribute or global config. Do NOT hardcode here.

  const scriptTag = document.querySelector('script[src$="data/sheets-helper.js"]');
  const urlAttr = scriptTag && scriptTag.getAttribute('data-app-script-url');
  const configUrl = (window.__three4five_config && window.__three4five_config.APP_SCRIPT_URL) || urlAttr || '';
  const APP_SCRIPT_URL = configUrl;

  if (!APP_SCRIPT_URL) {
    console.warn('sheets-helper: APP_SCRIPT_URL not configured, fallback only.');
    return;
  }

  async function getJSON(url){
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('Network error: ' + r.status);
    return r.json();
  }

  // Use form-encoded POST (application/x-www-form-urlencoded) to avoid CORS preflight
  async function postForm(action, payload){
    const form = new URLSearchParams();
    form.append('action', action);
    form.append('payload', JSON.stringify(payload || {}));

    const r = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      cache: 'no-store'
    });

    if (!r.ok) {
      const text = await r.text().catch(()=>'');
      throw new Error('Network error: ' + r.status + ' ' + text);
    }
    return r.json();
  }

  window.__three4five_sheets = {
    getMenu: async function(){
      const url = APP_SCRIPT_URL + '?action=getMenu';
      const res = await getJSON(url);
      return (res && res.menus) ? res.menus : [];
    },

    addMenu: async function(menu){
      return await postForm('addMenu', menu);
    },

    saveMenu: async function(menu){
      return await postForm('saveMenu', menu);
    },

    addTransaction: async function(trx){
      return await postForm('addTransaction', trx);
    }
  };
})();
