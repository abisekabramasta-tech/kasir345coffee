// sheets-helper.js (client) - calls Apps Script Web App
// Replaces the in-memory fallback so client talks to your deployed Apps Script.
(function(){
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

  async function postJSON(body){
    const r = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      return await postJSON({ action: 'addMenu', payload: menu });
    },

    saveMenu: async function(menu){
      return await postJSON({ action: 'saveMenu', payload: menu });
    },

    addTransaction: async function(trx){
      return await postJSON({ action: 'addTransaction', payload: trx });
    }
  };
})();
