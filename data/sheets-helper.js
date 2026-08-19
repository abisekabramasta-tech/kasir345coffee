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

    // Override loadDataFromSheets with a safe wrapper so UI code can call it without errors
    try {
      if (typeof window.loadDataFromSheets === 'function') {
        const _origLoad = window.loadDataFromSheets;
        window.loadDataFromSheets = async function(){
          // If a real sheets helper exists, prefer calling original
          if (window.__three4five_sheets && typeof window.__three4five_sheets.getMenu === 'function') {
            try {
              return await _origLoad();
            } catch(e) {
              console.error('loadDataFromSheets error (original):', e);
              // fallback to rendering local menuList
              try { renderMenu(); } catch(err){/* ignore */}
            }
          } else {
            // No remote helper: render local menuList
            try {
              const menus = Array.isArray(window.menuList) ? window.menuList : [];
              window.menuList = menus;
              try { renderMenu(); } catch(err){}
              return menus;
            } catch(e) {
              console.error('loadDataFromSheets fallback error', e);
              try { renderMenu(); } catch(err){}
            }
          }
        };
      }
    } catch(err) {
      console.warn('sheets-helper fallback: override loadDataFromSheets failed', err);
    }
  });
})();
