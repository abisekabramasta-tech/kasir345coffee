// Minimal sheets-helper fallback for kasir345coffee
// Provides the functions the app expects so it works without Google Sheets
(function(){
  if (window.__three4five_sheets) return;

  window.__three4five_sheets = {
    getMenu: async function(){
      // Return persisted menuList if available, otherwise an empty array
      try { return Array.isArray(window.menuList) ? window.menuList : []; } catch(e){ return []; }
    },

    addMenu: async function(menu){
      window.menuList = window.menuList || [];
      window.menuList.push(menu);
      return { ok: true };
    },

    saveMenu: async function(menu){
      window.menuList = window.menuList || [];
      const idx = window.menuList.findIndex(m => String(m.id) === String(menu.id));
      if (idx !== -1) {
        window.menuList[idx] = Object.assign({}, window.menuList[idx], menu);
      } else {
        window.menuList.push(menu);
      }
      return { ok: true };
    },

    addTransaction: async function(trx){
      window.__three4five_transactions = window.__three4five_transactions || [];
      window.__three4five_transactions.push(trx);
      return { ok: true };
    }
  };

  // Initialize Bootstrap modals once DOM is ready (bootstrap script in index.html is loaded before inline app script)
  document.addEventListener('DOMContentLoaded', function(){
    try {
      if (window.bootstrap) {
        if (document.getElementById('addMenuModal')) {
          // avoid overwriting if app already created instances
          if (!window.addMenuModalInstance) window.addMenuModalInstance = new bootstrap.Modal(document.getElementById('addMenuModal'));
          if (!window.editMenuModalInstance) window.editMenuModalInstance = new bootstrap.Modal(document.getElementById('editMenuModal'));
          if (!window.receiptModalInstance) window.receiptModalInstance = new bootstrap.Modal(document.getElementById('receiptModal'));
        }
      }
    } catch(err) {
      console.warn('sheets-helper fallback: modal init failed', err);
    }
  });
})();
