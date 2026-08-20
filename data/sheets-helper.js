// sheets-helper.js (client) - calls Apps Script Web App
// Uses form-encoded POST to avoid CORS preflight with Apps Script
(function(){
  // Read URL from script tag attribute or global config. Do NOT hardcode here.

  const scriptTag = document.querySelector('script[src$="data/sheets-helper.js"]');
  const urlAttr = scriptTag && scriptTag.getAttribute('data-app-script-url');
  const configUrl = (window.__three4five_config && window.__three4five_config.APP_SCRIPT_URL) || urlAttr || '';
  const APP_SCRIPT_URL = configUrl;

  if (!APP_SCRIPT_URL) {
    console.warn('sheets-helper: APP_SCRIPT_URL not configured, using mock mode.');
    // Setup fallback mock for development
    setupMockData();
  }

  /**
   * Fetch JSON dengan retry logic dan error handling
   */
  async function getJSON(url) {
    try {
      const r = await fetch(url, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      }
      const data = await r.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (e) {
      console.error('[sheets-helper] getJSON error:', e.message);
      throw e;
    }
  }

  /**
   * POST dengan form-encoded (menghindari CORS preflight)
   * Apps Script Web App memerlukan form-encoded untuk fungsi optimal
   */
  async function postForm(action, payload) {
    try {
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
        const text = await r.text().catch(() => '');
        throw new Error(`HTTP ${r.status}: ${text}`);
      }

      const data = await r.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (e) {
      console.error('[sheets-helper] postForm error:', e.message);
      throw e;
    }
  }

  /**
   * Mock data untuk development/testing
   * Replace dengan real API ketika Apps Script siap
   */
  function setupMockData() {
    // Cache mock data di localStorage
    if (!localStorage.getItem('mock_menus')) {
      const defaultMenus = [
        {
          id: 'MNU-001',
          name: 'Espresso',
          category: 'americano',
          price: 15000,
          stock: 50,
          image: 'https://via.placeholder.com/600x400?text=Espresso'
        },
        {
          id: 'MNU-002',
          name: 'Iced Latte',
          category: 'ice-coffee',
          price: 22000,
          stock: 45,
          image: 'https://via.placeholder.com/600x400?text=Iced+Latte'
        },
        {
          id: 'MNU-003',
          name: 'Caramel Macchiato',
          category: 'ice-coffee',
          price: 28000,
          stock: 40,
          image: 'https://via.placeholder.com/600x400?text=Caramel+Macchiato'
        },
        {
          id: 'MNU-004',
          name: 'Frappuccino',
          category: 'non-coffee',
          price: 25000,
          stock: 35,
          image: 'https://via.placeholder.com/600x400?text=Frappuccino'
        }
      ];
      localStorage.setItem('mock_menus', JSON.stringify(defaultMenus));
    }

    if (!localStorage.getItem('mock_transactions')) {
      localStorage.setItem('mock_transactions', JSON.stringify([]));
    }
  }

  /**
   * Fallback mock functions untuk testing tanpa Apps Script
   */
  const mockFunctions = {
    getMenu: async function() {
      try {
        const data = localStorage.getItem('mock_menus');
        return {
          ok: true,
          menus: data ? JSON.parse(data) : []
        };
      } catch (e) {
        console.error('Mock getMenu error:', e);
        return { ok: false, error: e.message };
      }
    },

    addMenu: async function(menu) {
      try {
        const menus = JSON.parse(localStorage.getItem('mock_menus') || '[]');
        menus.push(menu);
        localStorage.setItem('mock_menus', JSON.stringify(menus));
        return { ok: true, message: 'Menu ditambahkan' };
      } catch (e) {
        console.error('Mock addMenu error:', e);
        return { ok: false, error: e.message };
      }
    },

    saveMenu: async function(menu) {
      try {
        const menus = JSON.parse(localStorage.getItem('mock_menus') || '[]');
        const index = menus.findIndex(m => String(m.id) === String(menu.id));
        if (index !== -1) {
          menus[index] = { ...menus[index], ...menu };
          localStorage.setItem('mock_menus', JSON.stringify(menus));
          return { ok: true, message: 'Menu diperbarui' };
        }
        return { ok: false, error: 'Menu tidak ditemukan' };
      } catch (e) {
        console.error('Mock saveMenu error:', e);
        return { ok: false, error: e.message };
      }
    },

    addTransaction: async function(trx) {
      try {
        const transactions = JSON.parse(localStorage.getItem('mock_transactions') || '[]');
        transactions.push(trx);
        localStorage.setItem('mock_transactions', JSON.stringify(transactions));
        
        // Update stock untuk setiap item
        const menus = JSON.parse(localStorage.getItem('mock_menus') || '[]');
        trx.items.forEach(item => {
          const menu = menus.find(m => String(m.id) === String(item.id));
          if (menu) {
            menu.stock = Math.max(0, Number(menu.stock) - item.qty);
          }
        });
        localStorage.setItem('mock_menus', JSON.stringify(menus));
        
        return { ok: true, message: 'Transaksi disimpan', transactionId: trx.id };
      } catch (e) {
        console.error('Mock addTransaction error:', e);
        return { ok: false, error: e.message };
      }
    },

    getTransactions: async function() {
      try {
        const data = localStorage.getItem('mock_transactions');
        return {
          ok: true,
          transactions: data ? JSON.parse(data) : []
        };
      } catch (e) {
        console.error('Mock getTransactions error:', e);
        return { ok: false, error: e.message };
      }
    }
  };

  /**
   * Export API yang dipanggil oleh index.html
   * Automatic fallback ke mock jika Apps Script tidak tersedia
   */
  window.__three4five_sheets = {
    /**
     * Ambil semua menu dari Google Sheets
     * @returns {Promise<Array>} Array of menu objects
     */
    getMenu: async function() {
      try {
        if (!APP_SCRIPT_URL) {
          return mockFunctions.getMenu().then(r => (r.menus || []));
        }
        const res = await getJSON(APP_SCRIPT_URL + '?action=getMenu');
        return (res && res.menus) ? res.menus : [];
      } catch (e) {
        console.warn('[getMenu fallback] menggunakan mock data:', e.message);
        return mockFunctions.getMenu().then(r => (r.menus || []));
      }
    },

    /**
     * Tambah menu baru ke Google Sheets
     * @param {Object} menu - { name, price, stock, category, image }
     * @returns {Promise<Object>} { ok: boolean, message: string }
     */
    addMenu: async function(menu) {
      try {
        if (!APP_SCRIPT_URL) {
          return mockFunctions.addMenu(menu);
        }
        return await postForm('addMenu', menu);
      } catch (e) {
        console.warn('[addMenu fallback] menggunakan mock:', e.message);
        return mockFunctions.addMenu(menu);
      }
    },

    /**
     * Update menu di Google Sheets
     * @param {Object} menu - { id, name, price, stock, category, image }
     * @returns {Promise<Object>} { ok: boolean, message: string }
     */
    saveMenu: async function(menu) {
      try {
        if (!APP_SCRIPT_URL) {
          return mockFunctions.saveMenu(menu);
        }
        return await postForm('saveMenu', menu);
      } catch (e) {
        console.warn('[saveMenu fallback] menggunakan mock:', e.message);
        return mockFunctions.saveMenu(menu);
      }
    },

    /**
     * Simpan transaksi ke Google Sheets
     * @param {Object} trx - { id, date, items, method, total, cashReceived, change }
     * @returns {Promise<Object>} { ok: boolean, transactionId: string }
     */
    addTransaction: async function(trx) {
      try {
        if (!APP_SCRIPT_URL) {
          return mockFunctions.addTransaction(trx);
        }
        return await postForm('addTransaction', trx);
      } catch (e) {
        console.warn('[addTransaction fallback] menggunakan mock:', e.message);
        return mockFunctions.addTransaction(trx);
      }
    },

    /**
     * Ambil semua transaksi untuk laporan
     * @returns {Promise<Array>} Array of transaction objects
     */
    getTransactions: async function() {
      try {
        if (!APP_SCRIPT_URL) {
          return mockFunctions.getTransactions().then(r => (r.transactions || []));
        }
        const res = await getJSON(APP_SCRIPT_URL + '?action=getTransactions');
        return (res && res.transactions) ? res.transactions : [];
      } catch (e) {
        console.warn('[getTransactions fallback] menggunakan mock:', e.message);
        return mockFunctions.getTransactions().then(r => (r.transactions || []));
      }
    },

    /**
     * Helper: check koneksi ke Apps Script
     * @returns {Promise<boolean>}
     */
    isConnected: async function() {
      if (!APP_SCRIPT_URL) return false;
      try {
        await getJSON(APP_SCRIPT_URL + '?action=ping');
        return true;
      } catch {
        return false;
      }
    }
  };

})();
