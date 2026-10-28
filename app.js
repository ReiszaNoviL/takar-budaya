/**
 * TAKAR BUDAYA - Tata Kalkulasi Partisipasi Budaya
 * Skrip Logika Sederhana & Ramah Pengguna (Client-Side)
 * Berdasarkan Metodologi Herbert Jacobs: P = A x D x T x C
 */

(function () {
  'use strict';

  // --- STATE APLIKASI ---
  const state = {
    namaAcara: 'Pentas Seni & Budaya',
    tglAcara: '',
    jamAcara: '19.30 - 23.30 WIB',

    // Parameter A (Luas)
    areaMode: 'quick', // 'quick' | 'custom'
    quickAreaVal: 1000,
    customSubMode: 'pl', // 'pl' | 'total'
    panjang: 40,
    lebar: 25,
    totalLuasCustom: 1000,
    activeArea: 1000,
    descArea: 'Luas area penonton terhitung (1.000 m²)',

    // Parameter D (Kepadatan)
    density: 1.0,
    densityTitle: 'Sedang / Nyaman (Aman)',
    densityDesc: 'Kondisi normal wajar, penonton leluasa tanpa berdesakan',

    // Parameter T (Perputaran)
    turnover: 1,
    turnoverTitle: '1x (Satu Sesi)',
    turnoverDesc: 'Penonton tetap sama dari awal hingga selesai (tidak berganti)',

    // Parameter C (Aksesibilitas & Minat)
    correction: 0.8,
    correctionTitle: '0,8 (Tinggi)',
    correctionDesc: 'Akses mudah, waktu libur / akhir pekan, dan diminati warga',

    // Total
    totalResult: 800
  };

  // Helper Elements
  const el = (id) => document.getElementById(id);

  function setElText(id, text) {
    const target = el(id);
    if (target) target.textContent = text;
  }

  function formatIDRNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
  }

  function formatTanggalID(dateStr) {
    if (!dateStr) return 'Belum ditentukan';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (e) {
      console.warn('Format tanggal gagal:', e);
    }
    return dateStr;
  }

  // --- INISIALISASI ---
  function initApp() {
    initDefaultDate();
    bindEventInputs();
    bindAreaControls();
    bindSelectionCards();
    bindActionButtons();
    recalculate();
  }

  // Set default tanggal hari ini
  function initDefaultDate() {
    const inputTgl = el('tglAcara');
    if (inputTgl) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      inputTgl.value = todayStr;
      state.tglAcara = todayStr;
    }
  }

  // Bind input nama acara, tanggal, jam
  function bindEventInputs() {
    const inputNama = el('namaAcara');
    const inputTgl = el('tglAcara');
    const inputJam = el('jamAcara');

    if (inputNama) {
      inputNama.addEventListener('input', (e) => {
        state.namaAcara = e.target.value.trim() || 'Pentas Seni & Budaya';
      });
    }

    if (inputTgl) {
      inputTgl.addEventListener('change', (e) => {
        state.tglAcara = e.target.value;
      });
    }

    if (inputJam) {
      inputJam.addEventListener('input', (e) => {
        state.jamAcara = e.target.value.trim() || '-';
      });
    }
  }

  // Bind kontrol Luas (A)
  function bindAreaControls() {
    const quickBtns = document.querySelectorAll('#quickAreaGroup .quick-btn');
    const customBox = el('customAreaBox');
    const tabPL = el('tabModePL');
    const tabTotal = el('tabModeTotal');
    const panelPL = el('panelPL');
    const panelTotal = el('panelTotal');
    const inputPanjang = el('inputPanjang');
    const inputLebar = el('inputLebar');
    const inputTotalLuas = el('inputTotalLuas');

    quickBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        quickBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const areaAttr = btn.getAttribute('data-area');
        if (areaAttr === 'custom') {
          state.areaMode = 'custom';
          if (customBox) customBox.style.display = 'block';
          updateCustomArea();
        } else {
          state.areaMode = 'quick';
          if (customBox) customBox.style.display = 'none';
          state.quickAreaVal = parseFloat(areaAttr) || 1000;
          state.activeArea = state.quickAreaVal;
          state.descArea = `Pilihan cepat luas wilayah ${formatIDRNumber(state.activeArea)} m²`;
          recalculate();
        }
      });
    });

    // Sub-tab Panjang x Lebar vs Total Luas
    if (tabPL && tabTotal) {
      tabPL.addEventListener('click', () => {
        state.customSubMode = 'pl';
        tabPL.classList.add('active');
        tabTotal.classList.remove('active');
        if (panelPL) panelPL.classList.remove('hidden');
        if (panelTotal) panelTotal.classList.add('hidden');
        updateCustomArea();
      });

      tabTotal.addEventListener('click', () => {
        state.customSubMode = 'total';
        tabTotal.classList.add('active');
        tabPL.classList.remove('active');
        if (panelTotal) panelTotal.classList.remove('hidden');
        if (panelPL) panelPL.classList.add('hidden');
        updateCustomArea();
      });
    }

    if (inputPanjang) {
      inputPanjang.addEventListener('input', (e) => {
        state.panjang = Math.max(1, parseFloat(e.target.value) || 0);
        if (state.areaMode === 'custom' && state.customSubMode === 'pl') {
          updateCustomArea();
        }
      });
    }

    if (inputLebar) {
      inputLebar.addEventListener('input', (e) => {
        state.lebar = Math.max(1, parseFloat(e.target.value) || 0);
        if (state.areaMode === 'custom' && state.customSubMode === 'pl') {
          updateCustomArea();
        }
      });
    }

    if (inputTotalLuas) {
      inputTotalLuas.addEventListener('input', (e) => {
        state.totalLuasCustom = Math.max(1, parseFloat(e.target.value) || 0);
        if (state.areaMode === 'custom' && state.customSubMode === 'total') {
          updateCustomArea();
        }
      });
    }

    function updateCustomArea() {
      if (state.customSubMode === 'pl') {
        state.activeArea = Math.round(state.panjang * state.lebar);
        state.descArea = `Ukuran lapangan: ${state.panjang} m × ${state.lebar} m = ${formatIDRNumber(state.activeArea)} m²`;
      } else {
        state.activeArea = Math.round(state.totalLuasCustom);
        state.descArea = `Total luas wilayah dimasukkan manual: ${formatIDRNumber(state.activeArea)} m²`;
      }
      recalculate();
    }
  }

  // Bind opsi pilihan D, T, C
  function bindSelectionCards() {
    setupGroupSelection('groupDensity', (card) => {
      state.density = parseFloat(card.getAttribute('data-val')) || 1.0;
      const titleEl = card.querySelector('.select-title');
      const noteEl = card.querySelector('.select-note');
      state.densityTitle = titleEl ? titleEl.textContent.trim() : `${state.density} org/m²`;
      state.densityDesc = noteEl ? noteEl.textContent.trim() : '';
      recalculate();
    });

    setupGroupSelection('groupTurnover', (card) => {
      state.turnover = parseInt(card.getAttribute('data-val'), 10) || 1;
      const titleEl = card.querySelector('.select-title');
      const noteEl = card.querySelector('.select-note');
      state.turnoverTitle = titleEl ? titleEl.textContent.trim() : `T = ${state.turnover}x`;
      state.turnoverDesc = noteEl ? noteEl.textContent.trim() : '';
      recalculate();
    });

    setupGroupSelection('groupCorrection', (card) => {
      state.correction = parseFloat(card.getAttribute('data-val')) || 0.8;
      const titleEl = card.querySelector('.select-title');
      const noteEl = card.querySelector('.select-note');
      state.correctionTitle = titleEl ? titleEl.textContent.trim() : `C = ${state.correction}`;
      state.correctionDesc = noteEl ? noteEl.textContent.trim() : '';
      recalculate();
    });
  }

  function setupGroupSelection(groupId, onSelectCallback) {
    const group = el(groupId);
    if (!group) return;
    const cards = group.querySelectorAll('.select-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        onSelectCallback(card);
      });
    });
  }

  // --- KALKULASI UTAMA METODE JACOBS ---
  function recalculate() {
    const A = Math.max(1, state.activeArea || 0);
    const D = state.density;
    const T = state.turnover;
    const C = state.correction;

    // Rumus Jacobs: P = A x D x T x C
    const total = Math.round(A * D * T * C);
    state.totalResult = total;

    // Format tampilan angka
    const strA = formatIDRNumber(A);
    const strD = D.toString().replace('.', ',');
    const strT = T.toString();
    const strC = C.toString().replace('.', ',');
    const strTotal = formatIDRNumber(total);

    // Update UI Tampilan
    setElText('badgeLuas', `${strA} m²`);
    setElText('txtTotalResult', strTotal);
    setElText(
      'txtFormulaProof',
      `${strA} m² × ${strD} × ${strT} × ${strC} = ${strTotal} orang`
    );
  }

  // --- TOMBOL AKSI: SALIN WHATSAPP & CETAK PDF ---
  function bindActionButtons() {
    const btnWA = el('btnSalinWA');
    const btnPDF = el('btnCetakPDF');

    if (btnWA) {
      btnWA.addEventListener('click', copyWhatsAppSummary);
    }

    if (btnPDF) {
      btnPDF.addEventListener('click', prepareAndPrintPDF);
    }
  }

  function copyWhatsAppSummary() {
    const strA = formatIDRNumber(state.activeArea);
    const strD = state.density.toString().replace('.', ',');
    const strT = state.turnover.toString();
    const strC = state.correction.toString().replace('.', ',');
    const strTotal = formatIDRNumber(state.totalResult);
    const strTgl = formatTanggalID(state.tglAcara);

    const waText = 
`*ESTIMASI PENONTON GELARAN ACARA BUDAYA*
🏛️ *TAKAR BUDAYA* (Metode Herbert Jacobs)
---------------------------------------------
🎪 *Nama Acara:* ${state.namaAcara}
📅 *Tanggal:* ${strTgl}
⏰ *Waktu:* ${state.jamAcara}

📊 *Rincian Parameter Lapangan:*
1. Luas Area (A)       : ${strA} m²
2. Kepadatan (D)       : ${strD} orang/m² (${state.densityTitle})
3. Perputaran (T)      : ${strT}x (${state.turnoverTitle})
4. Akses & Minat (C)   : ${strC} (${state.correctionTitle})

🧮 *Perhitungan Rumus (P = A × D × T × C):*
${strA} m² × ${strD} × ${strT} × ${strC} = *${strTotal} Orang*

🎯 *TOTAL ESTIMASI PENONTON:*
👉 *${strTotal} ORANG / JIWA*
---------------------------------------------
_Dihitung melalui instrumen bantu Takar Budaya._`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(waText).then(() => {
        showToast();
      }).catch(() => {
        fallbackCopyText(waText);
      });
    } else {
      fallbackCopyText(waText);
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast();
    } catch (err) {
      alert('Gagal menyalin pesan otomatis. Silakan salin manual.');
    }
    document.body.removeChild(textarea);
  }

  function showToast() {
    const toast = el('toastCopy');
    if (!toast) return;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  function prepareAndPrintPDF() {
    const strA = formatIDRNumber(state.activeArea);
    const strD = state.density.toString().replace('.', ',');
    const strT = state.turnover.toString();
    const strC = state.correction.toString().replace('.', ',');
    const strTotal = formatIDRNumber(state.totalResult);

    // Populate data identitas acara
    setElText('pdfNamaAcara', state.namaAcara);
    setElText('pdfTglAcara', formatTanggalID(state.tglAcara));
    setElText('pdfJamAcara', state.jamAcara);

    const now = new Date();
    const printTimeStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' pukul ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setElText('pdfWaktuCetak', printTimeStr);

    // Populate tabel rincian
    setElText('pdfRowArea', `${strA} m²`);
    setElText('pdfDescArea', state.descArea);

    setElText('pdfRowDensity', `${strD} org/m²`);
    setElText('pdfDescDensity', `${state.densityTitle} — ${state.densityDesc}`);

    setElText('pdfRowTurnover', `${strT}x`);
    setElText('pdfDescTurnover', `${state.turnoverTitle} — ${state.turnoverDesc}`);

    setElText('pdfRowCorrection', `${strC}`);
    setElText('pdfDescCorrection', `${state.correctionTitle} — ${state.correctionDesc}`);

    // Populate hasil kalkulasi
    setElText(
      'pdfCalcFormula',
      `${strA} m² × ${strD} × ${strT} × ${strC} = ${strTotal} Orang`
    );
    setElText('pdfResultNumber', `${strTotal} ORANG / JIWA`);

    // Panggil window.print()
    setTimeout(() => {
      window.print();
    }, 150);
  }

  // Mulai saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();