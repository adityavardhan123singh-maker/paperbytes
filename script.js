(() => {
      'use strict';

      // Live Render Microservice Gateway
      const GATEWAY_URL = 'https://convertx-backend-a9il.onrender.com';

      // Navigation Handlers
      window.showDashboard = () => {
        document.getElementById('dashboard-view').style.display = 'block';
        document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      window.openTool = (toolId) => {
        document.getElementById('dashboard-view').style.display = 'none';
        document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(toolId);
        if (target) {
          target.classList.add('active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      window.filterGallery = (category, btnElement) => {
        const targetBtn = btnElement || (window.event ? window.event.target.closest('.filter-btn') : null);
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active-filter');
        });
        if (targetBtn) {
          targetBtn.classList.add('active-filter');
        }

        const cards = document.querySelectorAll('#tools-grid > div');
        cards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          card.style.display = (category === 'all' || cardCat === category) ? 'flex' : 'none';
        });
      };

      window.handleSearch = (query) => {
        const dropdown = document.getElementById('search-dropdown');
        const list = document.getElementById('search-list');
        const clean = (query || '').trim().toLowerCase();
        
        if (!clean) {
          dropdown.classList.add('hidden');
          return;
        }

        const tools = [
          { id: 'tool-pdf-to-word-real', title: 'PDF to Word DOCX', desc: 'Convert PDF to editable Word document' },
          { id: 'tool-excel-to-pdf', title: 'Excel to PDF', desc: 'Convert spreadsheet tables to PDF' },
          { id: 'tool-rotate-delete', title: 'Rotate & Delete Pages', desc: 'Reorder, rotate 90/180 deg, remove pages' },
          { id: 'tool-password-protect', title: 'Password Protect PDF', desc: 'Encrypt document with password' },
          { id: 'tool-watermark', title: 'Diagonal Watermark', desc: 'Add confidential stamp overlay' },
          { id: 'tool-extract-images', title: 'Extract Images to ZIP', desc: 'Unpack embedded PDF photos' },
          { id: 'tool-scanner-effect', title: 'Document Scanner Filter', desc: 'Enhance phone photo into black/white scan' },
          { id: 'tool-portal-crop', title: 'Passport Crop & Compress (50KB)', desc: 'Crop photo and fit under 50KB or 20KB' },
          { id: 'tool-merge-pdf', title: 'Merge PDF Documents', desc: 'Combine multiple PDF files into one' },
          { id: 'tool-split-pdf', title: 'Split & Extract Ranges', desc: 'Extract page intervals or unpack to ZIP' },
          { id: 'tool-images-to-pdf', title: 'Images to PDF Document', desc: 'Convert JPG, PNG, WebP photos to PDF' },
          { id: 'tool-omni-convert', title: 'PaperBytes Omni-Converter', desc: 'Universal cross-format conversion matrix' },
          { id: 'tool-page-numbers', title: 'Add Page Numbers & Bates', desc: 'Stamp sequential pagination or Page X of Y' },
          { id: 'tool-hash-verifier', title: 'Document Hash & Integrity', desc: 'Compute SHA-256 and SHA-1 checksums' },
          { id: 'tool-word-to-pdf', title: 'Word (.docx) to PDF', desc: 'Convert Word documents to formatted PDF in browser' }
        ];

        const matches = tools.filter(t => t.title.toLowerCase().includes(clean) || t.desc.toLowerCase().includes(clean));
        
        if (matches.length === 0) {
          list.innerHTML = '<div class="p-3 text-xs text-[#9AA3B8] text-center">No matching tools found</div>';
        } else {
          list.innerHTML = matches.map(m => `
            <div onclick="openTool('${m.id}'); document.getElementById('search-dropdown').classList.add('hidden');" class="p-3 hover:bg-[#0F121A] cursor-pointer transition">
              <p class="font-brand font-bold text-xs text-[#F3F5FA]">${m.title}</p>
              <p class="text-[11px] text-[#9AA3B8]">${m.desc}</p>
            </div>
          `).join('');
        }
        dropdown.classList.remove('hidden');
      };

      // Modal Controls
      window.openPrivacyModal = () => document.getElementById('privacy-modal').classList.remove('hidden');
      window.openTermsModal = () => document.getElementById('terms-modal').classList.remove('hidden');
      window.openCopyrightModal = () => document.getElementById('copyright-modal').classList.remove('hidden');
      window.closeModals = () => {
        document.getElementById('privacy-modal').classList.add('hidden');
        document.getElementById('terms-modal').classList.add('hidden');
        document.getElementById('copyright-modal').classList.add('hidden');
      };

      window.addEventListener('click', (e) => {
        ['privacy-modal', 'terms-modal', 'copyright-modal'].forEach(id => {
          const el = document.getElementById(id);
          if (e.target === el) el.classList.add('hidden');
        });
      });

      // Tool 1: PDF to Word
      let targetFile = null;
      window.handlePDFToWordSelection = (input) => {
        if (input.files && input.files[0]) {
          const f = input.files[0];
          if (f.size > 15 * 1024 * 1024) {
            alert('File exceeds safe limit of 15 MB.');
            input.value = '';
            return;
          }
          targetFile = f;
          document.getElementById('real-pdf-filename').innerText = `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`;
          document.getElementById('real-pdf-status').innerText = 'Ready to convert';
          const ind = document.getElementById('pdf-status-indicator');
          if (ind) ind.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
          document.getElementById('real-pdf-btn').disabled = false;
          document.getElementById('real-pdf-cancel-btn').classList.remove('hidden');
        }
      };

      window.executePDFToWordSecure = async () => {
        if (!targetFile) return;
        const btn = document.getElementById('real-pdf-btn');
        const status = document.getElementById('real-pdf-status');
        const ind = document.getElementById('pdf-status-indicator');

        btn.disabled = true;
        status.innerText = 'Connecting to cloud engine (if sleeping, warming up ~30s)...';
        if (ind) ind.className = 'w-2 h-2 rounded-full bg-amber-500 animate-ping';

        // Cold-start progress feedback
        let secondsWaiting = 0;
        const progressTimer = setInterval(() => {
          secondsWaiting += 2;
          if (secondsWaiting > 4) {
            status.innerText = `Waking up free cloud container... (${secondsWaiting}s elapsed)`;
          }
        }, 2000);

        try {
          const formData = new FormData();
          formData.append('file', targetFile);

          const response = await fetch(`${GATEWAY_URL}/convert/pdf-to-docx`, {
            method: 'POST',
            body: formData,
            credentials: 'omit'
          });

          clearInterval(progressTimer);

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Cloud engine returned error ${response.status}: ${errText || response.statusText}`);
          }

          status.innerText = 'Conversion finished. Downloading...';
          if (ind) ind.className = 'w-2 h-2 rounded-full bg-emerald-500';

          const blob = await response.blob();
          const dlUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = dlUrl;
          link.download = targetFile.name.replace(/\.[^/.]+$/, "") + ".docx";
          document.body.appendChild(link);
          link.click();
          link.remove();
          
          setTimeout(() => {
            window.URL.revokeObjectURL(dlUrl);
            targetFile = null;
          }, 15000);

          status.innerText = 'Document converted and downloaded.';
        } catch (err) {
          clearInterval(progressTimer);
          console.error("Conversion failed:", err);
          status.innerText = `Connection failed (${err.message || 'Server waking up'}). Try again in 15 seconds.`;
          if (ind) ind.className = 'w-2 h-2 rounded-full bg-rose-500';
        } finally {
          btn.disabled = false;
        }
      };

      // Tool 2: Excel to PDF
      let sheetData = [];
      window.handleExcelSelection = (input) => {
        if (input.files && input.files[0]) {
          const f = input.files[0];
          document.getElementById('excel-filename').innerText = f.name;
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const sName = wb.SheetNames[0];
            sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sName], { header: 1 });
            if (sheetData.length > 0) {
              const preview = document.getElementById('excel-table-preview');
              preview.innerHTML = sheetData.slice(0, 5).map((r, i) => `
                <tr class="${i === 0 ? 'bg-slate-100 font-bold' : ''}">
                  ${r.map(c => `<td class="px-3 py-1.5 border border-slate-200">${c !== undefined ? c : ''}</td>`).join('')}
                </tr>
              `).join('');
              document.getElementById('excel-preview-box').classList.remove('hidden');
              document.getElementById('excel-status').innerText = `Parsed ${sheetData.length} records.`;
              document.getElementById('excel-convert-btn').disabled = false;
              document.getElementById('excel-cancel-btn').classList.remove('hidden');
            }
          };
          reader.readAsArrayBuffer(f);
        }
      };

      window.executeExcelToPDF = () => {
        if (!sheetData || sheetData.length === 0) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.autoTable({
          head: [sheetData[0]],
          body: sheetData.slice(1),
          theme: 'grid',
          styles: { fontSize: 8, font: 'helvetica' },
          headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save('spreadsheet_export.pdf');
        document.getElementById('excel-status').innerText = 'Exported PDF table.';
        sheetData = [];
      };

      // Tool 3: Rotate & Delete
      let rawSourceBuffer = null;
      let rotations = [];
      let deletedSet = new Set();
      window.handleOrganizePDF = async (input) => {
        if (!input.files || !input.files[0]) return;
        rawSourceBuffer = await input.files[0].arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: rawSourceBuffer }).promise;
        const count = pdf.numPages;

        rotations = new Array(count).fill(0);
        deletedSet.clear();

        const grid = document.getElementById('organize-pages-grid');
        grid.innerHTML = '';

        for (let i = 1; i <= count; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 0.28 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

          const card = document.createElement('div');
          card.id = `page-card-${i-1}`;
          card.className = 'border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col items-center gap-2';
          card.innerHTML = `
            <div class="overflow-hidden flex items-center justify-center h-32 w-full">
              <img src="${canvas.toDataURL()}" id="thumb-img-${i-1}" class="max-h-full object-contain" />
            </div>
            <div class="flex items-center justify-between w-full text-[11px] font-mono-code pt-1 border-t border-slate-200">
              <span>P.${i}</span>
              <div class="flex gap-1">
                <button onclick="rotatePageThumb(${i-1})" class="p-1 hover:bg-slate-200 rounded text-slate-700">⟳</button>
                <button onclick="toggleDeletePage(${i-1})" class="p-1 hover:bg-rose-100 rounded text-rose-600">✕</button>
              </div>
            </div>
          `;
          grid.appendChild(card);
        }
        document.getElementById('organize-status').innerText = `${count} pages loaded.`;
        document.getElementById('save-organize-btn').disabled = false;
        document.getElementById('organize-cancel-btn').classList.remove('hidden');
      };

      window.rotatePageThumb = (idx) => {
        rotations[idx] = (rotations[idx] + 90) % 360;
        const img = document.getElementById(`thumb-img-${idx}`);
        if (img) img.style.transform = `rotate(${rotations[idx]}deg)`;
      };

      window.toggleDeletePage = (idx) => {
        const card = document.getElementById(`page-card-${idx}`);
        if (deletedSet.has(idx)) {
          deletedSet.delete(idx);
          card.classList.remove('opacity-30', 'grayscale');
        } else {
          deletedSet.add(idx);
          card.classList.add('opacity-30', 'grayscale');
        }
      };

      window.executeSaveOrganizedPDF = async () => {
        if (!rawSourceBuffer) return;
        const { PDFDocument, degrees } = PDFLib;
        const src = await PDFDocument.load(rawSourceBuffer);
        const out = await PDFDocument.create();
        const total = src.getPageCount();

        for (let i = 0; i < total; i++) {
          if (!deletedSet.has(i)) {
            const [p] = await out.copyPages(src, [i]);
            const currRot = p.getRotation().angle;
            p.setRotation(degrees((currRot + rotations[i]) % 360));
            out.addPage(p);
          }
        }

        const outBytes = await out.save();
        saveAs(new Blob([outBytes], { type: 'application/pdf' }), 'reorganized.pdf');
        document.getElementById('organize-status').innerText = 'Saved modified PDF.';
        rawSourceBuffer = null;
      };

      // Tool 4: Password Protect (AES-256 via Zero-Retention Core)
      let pProtectFile = null;
      window.handleProtectPDFSelection = async (input) => {
        if (input.files && input.files[0]) {
          pProtectFile = input.files[0];
          document.getElementById('protect-pdf-name').innerText = pProtectFile.name;
          document.getElementById('protect-btn').disabled = false;
          document.getElementById('protect-cancel-btn').classList.remove('hidden');
          document.getElementById('protect-status').innerText = 'Ready to encrypt. Enter and confirm password.';
        }
      };

      window.executePasswordProtect = async () => {
        const p1 = document.getElementById('protect-user-pass').value;
        const p2 = document.getElementById('protect-confirm-pass').value;
        const st = document.getElementById('protect-status');
        const btn = document.getElementById('protect-btn');

        if (!pProtectFile) {
          st.innerText = 'Please select a PDF document first.';
          return;
        }
        if (!p1) {
          st.innerText = 'Please enter a password.';
          return;
        }
        if (p1 !== p2) {
          st.innerText = 'Passwords do not match.';
          return;
        }

        st.innerText = 'Encrypting with AES-256 (Zero-Retention Core)...';
        btn.disabled = true;

        try {
          const formData = new FormData();
          formData.append('file', pProtectFile);
          formData.append('password', p1);

          const response = await fetch(`${GATEWAY_URL}/security/password-protect`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            let errMsg = 'Encryption failed';
            try {
              const errJson = await response.json();
              if (errJson && errJson.detail) errMsg = errJson.detail;
            } catch (e) {}
            throw new Error(errMsg);
          }

          const blob = await response.blob();
          const cleanBase = pProtectFile.name.replace(/\.[^/.]+$/, '');
          const safeBase = cleanBase.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'document';
          const downloadName = `protected_${safeBase}.pdf`;

          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = dlUrl;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(dlUrl), 2000);

          st.innerText = 'Document successfully encrypted with AES-256 and downloaded!';
        } catch (err) {
          st.innerText = 'Error: ' + (err.message || 'Encryption failed');
        } finally {
          btn.disabled = false;
        }
      };

      // Tool 5: Watermark
      let wmBuf = null;
      window.handleWatermarkSelection = async (input) => {
        if (input.files && input.files[0]) {
          wmBuf = await input.files[0].arrayBuffer();
          document.getElementById('watermark-pdf-name').innerText = input.files[0].name;
          document.getElementById('watermark-btn').disabled = false;
        document.getElementById('watermark-cancel-btn').classList.remove('hidden');
        }
      };

      window.executeWatermark = async () => {
        if (!wmBuf) return;
        const { PDFDocument, rgb, degrees } = window.PDFLib || PDFLib;
        const txt = document.getElementById('watermark-text').value || 'CONFIDENTIAL';
        const sz = parseInt(document.getElementById('watermark-size').value) || 48;
        const op = parseFloat(document.getElementById('watermark-opacity').value) || 0.25;

        const doc = await PDFDocument.load(wmBuf);
        doc.getPages().forEach(p => {
          const { width, height } = p.getSize();
          p.drawText(txt, {
            x: width / 4,
            y: height / 2,
            size: sz,
            color: rgb(0.25, 0.25, 0.25),
            opacity: op,
            rotate: degrees(45)
          });
        });

        const out = await doc.save();
        saveAs(new Blob([out], { type: 'application/pdf' }), 'watermarked.pdf');
        document.getElementById('watermark-status').innerText = 'Watermark applied.';
        wmBuf = null;
      };

      // Tool 6: Extract Images
      let extFile = null;
      window.handleExtractSelection = (input) => {
        if (input.files && input.files[0]) {
          extFile = input.files[0];
          document.getElementById('extract-pdf-name').innerText = extFile.name;
          document.getElementById('extract-btn').disabled = false;
        document.getElementById('extract-cancel-btn').classList.remove('hidden');
        }
      };

      window.executeImageExtraction = async () => {
        if (!extFile) return;
        const st = document.getElementById('extract-status');
        st.innerText = 'Unpacking image layers...';

        const buf = await extFile.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const zip = new JSZip();
        let total = 0;

        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i);
          const vp = p.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          zip.file(`page_${i}.jpg`, dataUrl.replace(/^data:image\/jpeg;base64,/, ''), { base64: true });
          total++;
        }

        const out = await zip.generateAsync({ type: 'blob' });
        saveAs(out, 'extracted_graphics.zip');
        st.innerText = `Extracted ${total} graphics to archive.`;
        extFile = null;
      };

      // Tool 7: Scanner Effect
      window.handleScannerSelection = (input) => {
        if (input.files && input.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const raw = document.getElementById('scanner-raw-preview');
            raw.src = e.target.result;
            raw.classList.remove('hidden');

            raw.onload = () => {
              const canvas = document.getElementById('scanner-canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = raw.naturalWidth;
              canvas.height = raw.naturalHeight;
              ctx.drawImage(raw, 0, 0);

              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const d = imgData.data;
              for (let i = 0; i < d.length; i += 4) {
                const lum = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                const v = lum > 130 ? 255 : 0;
                d[i] = d[i+1] = d[i+2] = v;
              }
              ctx.putImageData(imgData, 0, 0);
              canvas.classList.remove('hidden');
              document.getElementById('scanner-btn').disabled = false;
              document.getElementById('scanner-cancel-btn').classList.remove('hidden');
              document.getElementById('scanner-status').innerText = 'Filter applied.';
            };
          };
          reader.readAsDataURL(input.files[0]);
        }
      };

      window.executeScannerDownload = () => {
        const canvas = document.getElementById('scanner-canvas');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 10, 10, 190, 0);
        pdf.save('scan.pdf');
      };

      // Tool 8: Portal Crop & Size Limit
      let cropper = null;
      window.handlePortalImageSelection = (input) => {
        if (input.files && input.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.getElementById('cropper-target');
            img.src = e.target.result;
            document.getElementById('cropper-wrapper').classList.remove('hidden');
            document.getElementById('portal-cancel-btn').classList.remove('hidden');
            if (cropper) cropper.destroy();
            cropper = new Cropper(img, { aspectRatio: 3.5 / 4.5, viewMode: 1 });
            document.getElementById('portal-btn').disabled = false;
            document.getElementById('portal-status').innerText = 'Adjust crop frame.';
          };
          reader.readAsDataURL(input.files[0]);
        }
      };

      window.applyCropPreset = (v) => {
        if (!cropper) return;
        if (v === 'passport') cropper.setAspectRatio(3.5 / 4.5);
        else if (v === 'square') cropper.setAspectRatio(1);
        else if (v === 'signature') cropper.setAspectRatio(3 / 1);
        else cropper.setAspectRatio(NaN);
      };

      window.executePortalCrop = async () => {
        if (!cropper) return;
        const status = document.getElementById('portal-status');
        const maxKB = parseInt(document.getElementById('portal-max-kb').value);
        const format = document.getElementById('portal-format').value;

        status.innerText = `Compressing iteratively to reach target <= ${maxKB} KB...`;
        const canvas = cropper.getCroppedCanvas();

        let low = 0.05, high = 0.95, bestBlob = null;
        for (let iter = 0; iter < 7; iter++) {
          const mid = (low + high) / 2;
          const blob = await new Promise(res => canvas.toBlob(res, format, mid));
          const sizeKB = blob.size / 1024;
          if (sizeKB <= maxKB) {
            bestBlob = blob;
            low = mid;
          } else {
            high = mid;
          }
        }

        if (!bestBlob) {
          bestBlob = await new Promise(res => canvas.toBlob(res, format, 0.05));
        }

        saveAs(bestBlob, `portal_${maxKB}kb.jpg`);
        status.innerText = `Final size: ${(bestBlob.size / 1024).toFixed(1)} KB (Target: <= ${maxKB} KB). Saved!`;
      };

      // Tool 9: Merge PDFs
      let mergeQueue = [];
      window.handleMergeFilesSelection = (input) => {
        if (input.files && input.files.length >= 2) {
          mergeQueue = Array.from(input.files);
          renderMergeQueue();
        }
      };

      window.executeMergePDF = async () => {
        if (mergeQueue.length < 2) return;
        const st = document.getElementById('merge-status');
        st.innerText = 'Unifying documents in memory...';

        const { PDFDocument } = window.PDFLib || PDFLib;
        const out = await PDFDocument.create();

        for (const file of mergeQueue) {
          const buf = await file.arrayBuffer();
          const doc = await PDFDocument.load(buf);
          const pages = await out.copyPages(doc, doc.getPageIndices());
          pages.forEach(p => out.addPage(p));
        }

        const bytes = await out.save();
        saveAs(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
        st.innerText = 'Merged document ready.';
        mergeQueue = [];
      };


      // Tool 10: Split PDF
      let splitSourceBuffer = null;
      let splitTotalPages = 0;
      let splitCurrentMode = 'range';

      window.handleSplitPDFSelection = async (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        document.getElementById('split-pdf-filename').innerText = file.name;
        splitSourceBuffer = await file.arrayBuffer();

        const { PDFDocument } = window.PDFLib || PDFLib;
        const doc = await PDFDocument.load(splitSourceBuffer);
        splitTotalPages = doc.getPageCount();

        document.getElementById('split-pdf-info').innerText = `Total Pages: ${splitTotalPages} | File Size: ${(file.size / 1024).toFixed(1)} KB`;
        document.getElementById('split-range-input').placeholder = `e.g. 1-${Math.min(splitTotalPages, 3)}, ${splitTotalPages}`;
        document.getElementById('split-controls').classList.remove('hidden');
        document.getElementById('split-cancel-btn').classList.remove('hidden');
        document.getElementById('split-status').innerText = `Ready to extract from ${splitTotalPages} pages.`;
      };

      window.toggleSplitMode = (mode) => {
        splitCurrentMode = mode;
      };

      window.executeSplitPDF = async () => {
        if (!splitSourceBuffer) return;
        const st = document.getElementById('split-status');
        const btn = document.getElementById('split-btn');
        btn.disabled = true;

        try {
          const { PDFDocument } = window.PDFLib || PDFLib;
          const srcDoc = await PDFDocument.load(splitSourceBuffer);

          if (splitCurrentMode === 'range') {
            const rawRange = document.getElementById('split-range-input').value.trim();
            if (!rawRange) {
              alert('Please enter a valid page range (e.g. 1-3, 5).');
              btn.disabled = false;
              return;
            }

            const indicesToExtract = new Set();
            const segments = rawRange.split(',');
            for (const seg of segments) {
              const part = seg.trim();
              if (part.includes('-')) {
                const [startStr, endStr] = part.split('-');
                const s = parseInt(startStr), e = parseInt(endStr);
                if (!isNaN(s) && !isNaN(e)) {
                  for (let p = Math.min(s, e); p <= Math.max(s, e); p++) {
                    if (p >= 1 && p <= splitTotalPages) indicesToExtract.add(p - 1);
                  }
                }
              } else {
                const p = parseInt(part);
                if (!isNaN(p) && p >= 1 && p <= splitTotalPages) indicesToExtract.add(p - 1);
              }
            }

            if (indicesToExtract.size === 0) {
              alert(`No valid pages found in range within bounds 1-${splitTotalPages}.`);
              btn.disabled = false;
              return;
            }

            st.innerText = `Extracting ${indicesToExtract.size} pages...`;
            const outDoc = await PDFDocument.create();
            const sortedIndices = Array.from(indicesToExtract).sort((a, b) => a - b);
            const copiedPages = await outDoc.copyPages(srcDoc, sortedIndices);
            copiedPages.forEach(p => outDoc.addPage(p));

            const outBytes = await outDoc.save();
            const outBlob = new Blob([outBytes], { type: 'application/pdf' });
            saveAs(outBlob, 'extracted_range.pdf');
            st.innerText = `Extracted ${indicesToExtract.size} pages to extracted_range.pdf`;
          } else {
            st.innerText = `Generating archive with ${splitTotalPages} separate PDFs...`;
            const zip = new JSZip();

            for (let i = 0; i < splitTotalPages; i++) {
              const singleDoc = await PDFDocument.create();
              const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
              singleDoc.addPage(copiedPage);
              const singleBytes = await singleDoc.save();
              zip.file(`page_${i + 1}.pdf`, singleBytes);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, 'split_all_pages.zip');
            st.innerText = `All ${splitTotalPages} pages extracted to split_all_pages.zip`;
          }
        } catch (err) {
          console.error(err);
          st.innerText = `Error: ${err.message}`;
        } finally {
          btn.disabled = false;
        }
      };

      // Tool 11: Images to PDF
      let imagePdfQueue = [];

      window.handleImagesToPDFSelection = (input) => {
        if (!input.files || input.files.length === 0) return;
        const files = Array.from(input.files);
        imagePdfQueue = [];
        const container = document.getElementById('images-pdf-list');
        container.innerHTML = '';

        let loaded = 0;
        files.forEach((f) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePdfQueue.push({ name: f.name, dataUrl: e.target.result, type: f.type });
            loaded++;
            if (loaded === files.length) {
              renderImagePdfQueue();
              document.getElementById('images-pdf-controls').classList.remove('hidden');
            }
          };
          reader.readAsDataURL(f);
        });
      };

      window.executeImagesToPDF = async () => {
        if (imagePdfQueue.length === 0) return;
        const st = document.getElementById('images-pdf-status');
        const btn = document.getElementById('images-pdf-btn');
        btn.disabled = true;
        st.innerText = 'Compiling PDF document...';

        try {
          const { PDFDocument } = window.PDFLib || PDFLib;
          const pdfDoc = await PDFDocument.create();
          const format = document.getElementById('images-pdf-format').value;
          const marginOpt = document.getElementById('images-pdf-margin').value;
          const margin = marginOpt === 'small' ? 28 : 0; // 28pt ~= 10mm

          for (const item of imagePdfQueue) {
            let imgBytes, embeddedImg;
            if (item.type === 'image/png') {
              const res = await fetch(item.dataUrl);
              imgBytes = await res.arrayBuffer();
              embeddedImg = await pdfDoc.embedPng(imgBytes);
            } else if (item.type === 'image/jpeg' || item.type === 'image/jpg') {
              const res = await fetch(item.dataUrl);
              imgBytes = await res.arrayBuffer();
              embeddedImg = await pdfDoc.embedJpg(imgBytes);
            } else {
              // Convert WEBP or others to JPEG via off-screen canvas
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const tempImg = new Image();
              await new Promise((res, rej) => {
                tempImg.onload = res;
                tempImg.onerror = rej;
                tempImg.src = item.dataUrl;
              });
              canvas.width = tempImg.naturalWidth;
              canvas.height = tempImg.naturalHeight;
              ctx.drawImage(tempImg, 0, 0);
              const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
              const res = await fetch(jpgDataUrl);
              imgBytes = await res.arrayBuffer();
              embeddedImg = await pdfDoc.embedJpg(imgBytes);
            }

            const imgWidth = embeddedImg.width;
            const imgHeight = embeddedImg.height;

            let pageWidth, pageHeight;
            if (format === 'a4-portrait') {
              pageWidth = 595.28; pageHeight = 841.89;
            } else if (format === 'a4-landscape') {
              pageWidth = 841.89; pageHeight = 595.28;
            } else {
              pageWidth = imgWidth + margin * 2;
              pageHeight = imgHeight + margin * 2;
            }

            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2;

            const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
            const drawWidth = imgWidth * scale;
            const drawHeight = imgHeight * scale;
            const drawX = margin + (availableWidth - drawWidth) / 2;
            const drawY = margin + (availableHeight - drawHeight) / 2;

            page.drawImage(embeddedImg, {
              x: drawX,
              y: drawY,
              width: drawWidth,
              height: drawHeight
            });
          }

          const pdfBytes = await pdfDoc.save();
          saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'compiled_images.pdf');
          st.innerText = `Compiled ${imagePdfQueue.length} images into compiled_images.pdf`;
        } catch (err) {
          console.error(err);
          st.innerText = `Error: ${err.message}`;
        } finally {
          btn.disabled = false;
        }
      };

      // Tool 12: Omni-Converter
      let omniFile = null;
      let omniCategory = null;

      window.handleOmniSelection = (input) => {
        if (!input.files || !input.files[0]) return;
        omniFile = input.files[0];
        const fname = omniFile.name.toLowerCase();
        const ext = fname.split('.').pop();
        const select = document.getElementById('omni-target-format');
        select.innerHTML = '';

        document.getElementById('omni-file-label').innerText = `${omniFile.name} (${(omniFile.size / 1024).toFixed(1)} KB)`;
        const badge = document.getElementById('omni-detected-badge');

        if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
          omniCategory = 'image';
          badge.innerText = `${ext.toUpperCase()} Image File`;
          const targets = ['JPG', 'PNG', 'WEBP', 'PDF'];
          targets.forEach(t => {
            if (t.toLowerCase() !== ext) select.innerHTML += `<option value="${t.toLowerCase()}">${t}</option>`;
          });
        } else if (['xlsx', 'xls'].includes(ext)) {
          omniCategory = 'spreadsheet';
          badge.innerText = 'Excel Spreadsheet';
          select.innerHTML = '<option value="csv">CSV (Comma Separated)</option><option value="json">JSON Document</option><option value="pdf">PDF Table</option>';
        } else if (ext === 'csv') {
          omniCategory = 'csv';
          badge.innerText = 'CSV Data Table';
          select.innerHTML = '<option value="xlsx">Excel (.xlsx)</option><option value="json">JSON Document</option><option value="pdf">PDF Table</option>';
        } else if (ext === 'json') {
          omniCategory = 'json';
          badge.innerText = 'JSON Data Object';
          select.innerHTML = '<option value="csv">CSV Spreadsheet</option><option value="xlsx">Excel (.xlsx)</option>';
        } else if (ext === 'md') {
          omniCategory = 'markdown';
          badge.innerText = 'Markdown Document';
          select.innerHTML = '<option value="html">Rendered HTML</option><option value="pdf">Formatted PDF</option><option value="txt">Plain Text (.txt)</option>';
        } else if (ext === 'txt') {
          omniCategory = 'text';
          badge.innerText = 'Plain Text File';
          select.innerHTML = '<option value="pdf">Clean Monospace PDF</option>';
        } else {
          badge.innerText = 'Generic File';
          select.innerHTML = '<option value="pdf">Convert to PDF</option>';
          omniCategory = 'text';
        }

        document.getElementById('omni-controls').classList.remove('hidden');
        document.getElementById('omni-cancel-btn').classList.remove('hidden');
        document.getElementById('omni-status').innerText = 'Ready for transformation.';
      };

      window.executeOmniConversion = async () => {
        if (!omniFile) return;
        const st = document.getElementById('omni-status');
        const btn = document.getElementById('omni-btn');
        const target = document.getElementById('omni-target-format').value;
        btn.disabled = true;
        st.innerText = `Transforming into ${target.toUpperCase()}...`;

        try {
          const baseName = omniFile.name.replace(/\.[^/.]+$/, "");

          if (omniCategory === 'image') {
            const dataUrl = await new Promise((res) => {
              const r = new FileReader();
              r.onload = e => res(e.target.result);
              r.readAsDataURL(omniFile);
            });

            if (target === 'pdf') {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              ctx.drawImage(img, 0, 0);

              const { jsPDF } = window.jspdf;
              const isLandscape = canvas.width > canvas.height;
              const doc = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
              });
              doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, canvas.width, canvas.height);
              doc.save(`${baseName}.pdf`);
            } else {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              await new Promise(r => { img.onload = r; img.src = dataUrl; });
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              ctx.drawImage(img, 0, 0);
              const mime = target === 'jpg' ? 'image/jpeg' : `image/${target}`;
              canvas.toBlob(blob => {
                saveAs(blob, `${baseName}.${target}`);
              }, mime, 0.92);
            }
          } else if (omniCategory === 'spreadsheet' || omniCategory === 'csv') {
            const buf = await omniFile.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const sName = wb.SheetNames[0];

            if (target === 'csv') {
              const csvText = XLSX.utils.sheet_to_csv(wb.Sheets[sName]);
              saveAs(new Blob([csvText], { type: 'text/csv' }), `${baseName}.csv`);
            } else if (target === 'json') {
              const jsonArr = XLSX.utils.sheet_to_json(wb.Sheets[sName]);
              saveAs(new Blob([JSON.stringify(jsonArr, null, 2)], { type: 'application/json' }), `${baseName}.json`);
            } else if (target === 'xlsx') {
              const outWb = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
              saveAs(new Blob([outWb], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${baseName}.xlsx`);
            } else if (target === 'pdf') {
              const dataRows = XLSX.utils.sheet_to_json(wb.Sheets[sName], { header: 1 });
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF({ orientation: 'landscape' });
              doc.autoTable({
                head: [dataRows[0]],
                body: dataRows.slice(1),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [79, 70, 229] }
              });
              doc.save(`${baseName}.pdf`);
            }
          } else if (omniCategory === 'json') {
            const text = await omniFile.text();
            const parsed = JSON.parse(text);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            const ws = XLSX.utils.json_to_sheet(arr);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

            if (target === 'csv') {
              const csv = XLSX.utils.sheet_to_csv(ws);
              saveAs(new Blob([csv], { type: 'text/csv' }), `${baseName}.csv`);
            } else if (target === 'xlsx') {
              const outWb = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
              saveAs(new Blob([outWb], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${baseName}.xlsx`);
            }
          } else if (omniCategory === 'markdown') {
            const mdText = await omniFile.text();
            if (target === 'html') {
              const htmlContent = marked ? marked.parse(mdText) : `<pre>${mdText}</pre>`;
              const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#1e293b;}</style></head><body>${htmlContent}</body></html>`;
              saveAs(new Blob([fullHtml], { type: 'text/html' }), `${baseName}.html`);
            } else if (target === 'pdf') {
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF();
              const lines = doc.splitTextToSize(mdText, 180);
              doc.text(lines, 15, 15);
              doc.save(`${baseName}.pdf`);
            } else {
              saveAs(new Blob([mdText], { type: 'text/plain' }), `${baseName}.txt`);
            }
          } else {
            // Text to PDF
            const text = await omniFile.text();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFont('courier');
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(text, 180);
            doc.text(lines, 15, 15);
            doc.save(`${baseName}.pdf`);
          }

          st.innerText = `Conversion to ${target.toUpperCase()} complete!`;
        } catch (err) {
          console.error(err);
          st.innerText = `Error: ${err.message}`;
        } finally {
          btn.disabled = false;
        }
      };

      // Tool 13: Add Page Numbers
      let pageNumBuffer = null;
      window.handlePageNumSelection = async (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        document.getElementById('pagenum-file-label').innerText = file.name;
        pageNumBuffer = await file.arrayBuffer();
        document.getElementById('pagenum-controls').classList.remove('hidden');
        document.getElementById('pagenum-cancel-btn').classList.remove('hidden');
        document.getElementById('pagenum-status').innerText = 'Document loaded. Configure format and position.';
      };

      window.executeAddPageNumbers = async () => {
        if (!pageNumBuffer) return;
        const st = document.getElementById('pagenum-status');
        const btn = document.getElementById('pagenum-btn');
        btn.disabled = true;
        st.innerText = 'Stamping page numbers...';

        try {
          const { PDFDocument, StandardFonts, rgb } = window.PDFLib || PDFLib;
          const doc = await PDFDocument.load(pageNumBuffer);
          const font = await doc.embedFont(StandardFonts.Helvetica);
          const pageCount = doc.getPageCount();
          const format = document.getElementById('pagenum-format').value;
          const pos = document.getElementById('pagenum-position').value;
          const fontSize = parseInt(document.getElementById('pagenum-fontsize').value) || 10;

          for (let i = 0; i < pageCount; i++) {
            const page = doc.getPage(i);
            const { width, height } = page.getSize();
            const n = i + 1;

            let text = '';
            if (format === 'page_of') text = `Page ${n} of ${pageCount}`;
            else if (format === 'simple') text = `${n}`;
            else if (format === 'page_prefix') text = `Page ${n}`;
            else if (format === 'bates') text = `DOC-00${n}`;

            const textWidth = font.widthOfTextAtSize(text, fontSize);
            let x = 0, y = 0;
            const margin = 25;

            if (pos === 'bottom-center') {
              x = (width - textWidth) / 2;
              y = margin;
            } else if (pos === 'bottom-right') {
              x = width - textWidth - margin;
              y = margin;
            } else if (pos === 'bottom-left') {
              x = margin;
              y = margin;
            } else if (pos === 'top-right') {
              x = width - textWidth - margin;
              y = height - margin;
            }

            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0.3, 0.3, 0.3)
            });
          }

          const outBytes = await doc.save();
          saveAs(new Blob([outBytes], { type: 'application/pdf' }), 'numbered_document.pdf');
          st.innerText = `Stamped ${pageCount} pages. Download started!`;
        } catch (err) {
          console.error(err);
          st.innerText = `Error: ${err.message}`;
        } finally {
          btn.disabled = false;
        }
      };

      // Tool 14: Hash Verifier
      let currentHashSha256 = '';
      window.handleHashFileSelection = async (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        document.getElementById('hash-file-label').innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

        const buf = await file.arrayBuffer();

        // Calculate SHA-256
        const hash256Buf = await crypto.subtle.digest('SHA-256', buf);
        currentHashSha256 = Array.from(new Uint8Array(hash256Buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        document.getElementById('hash-sha256-val').innerText = currentHashSha256;

        // Calculate SHA-1
        const hash1Buf = await crypto.subtle.digest('SHA-1', buf);
        const hash1Hex = Array.from(new Uint8Array(hash1Buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        document.getElementById('hash-sha1-val').innerText = hash1Hex;

        document.getElementById('hash-results').classList.remove('hidden');
        document.getElementById('hash-cancel-btn').classList.remove('hidden');
      };

      window.copyHashText = (elemId) => {
        const text = document.getElementById(elemId).innerText;
        navigator.clipboard.writeText(text);
        alert('Cryptographic checksum copied to clipboard.');
      };

      window.compareChecksum = (val) => {
        const cleanExpected = val.trim().toLowerCase();
        const status = document.getElementById('hash-compare-status');
        if (!cleanExpected) {
          status.innerText = '';
          return;
        }
        if (cleanExpected === currentHashSha256.toLowerCase()) {
          status.innerHTML = '<span class="text-emerald-600 font-bold">✓ Checksums match perfectly. Document is authentic and untampered.</span>';
        } else {
          status.innerHTML = '<span class="text-rose-600 font-bold">✕ Checksum mismatch! The file does not match this hash.</span>';
        }
      };


      window.escapeHTML = escapeHTML;
      function escapeHTML(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }


      // Tool 15: Word to PDF Logic
      let wordDocBuffer = null;
      let wordOriginalName = 'document';

      window.handleWordSelection = async (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        wordOriginalName = file.name.replace(/\.[^/.]+$/, "");
        wordDocBuffer = await file.arrayBuffer();

        const status = document.getElementById('word-status');
        status.innerText = 'Parsing Word structure and typography in memory...';

        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: wordDocBuffer });
          const preview = document.getElementById('word-preview-container');
          preview.innerHTML = result.value || '<p class="text-[#9AA3B8]">Empty document content.</p>';
          document.getElementById('word-doc-name').innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          document.getElementById('word-preview-section').classList.remove('hidden');
          document.getElementById('word-cancel-btn').classList.remove('hidden');
          document.getElementById('word-dropzone').classList.add('hidden');
          status.innerText = 'Document parsed. Ready to export PDF.';
        } catch (err) {
          console.error(err);
          status.innerText = `Parsing error: ${err.message}`;
        }
      };

      window.clearWordDocument = () => {
        wordDocBuffer = null;
        document.getElementById('word-file-input').value = '';
        document.getElementById('word-preview-section').classList.add('hidden');
        document.getElementById('word-cancel-btn').classList.add('hidden');
        document.getElementById('word-dropzone').classList.remove('hidden');
        document.getElementById('word-status').innerText = 'Ready to convert.';
      };

      window.executeWordToPDF = () => {
        const element = document.getElementById('word-preview-container');
        const status = document.getElementById('word-status');
        status.innerText = 'Rendering vector PDF pages...';

        const opt = {
          margin: [12, 12, 12, 12],
          filename: `${wordOriginalName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
          status.innerText = 'PDF successfully generated and downloaded!';
        }).catch((err) => {
          console.error(err);
          status.innerText = `Export failed: ${err.message}`;
        });
      };

      // Photo Clear / Replace Handlers
      window.clearPortalPhoto = () => {
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }
        document.getElementById('portal-image-input').value = '';
        document.getElementById('cropper-wrapper').classList.add('hidden');
        document.getElementById('portal-cancel-btn').classList.add('hidden');
        document.getElementById('portal-btn').disabled = true;
        document.getElementById('portal-status').innerText = 'Load photo to configure';
      };

      window.clearScannerPhoto = () => {
        document.getElementById('scanner-input').value = '';
        document.getElementById('scanner-raw-preview').src = '';
        document.getElementById('scanner-raw-preview').classList.add('hidden');
        document.getElementById('scanner-canvas').classList.add('hidden');
        document.getElementById('scanner-cancel-btn').classList.add('hidden');
        document.getElementById('scanner-btn').disabled = true;
        document.getElementById('scanner-status').innerText = 'Provide photo to process';
      };

      window.clearOmniFile = () => {
        omniFile = null;
        omniCategory = null;
        document.getElementById('omni-file-input').value = '';
        document.getElementById('omni-controls').classList.add('hidden');
        document.getElementById('omni-cancel-btn').classList.add('hidden');
        document.getElementById('omni-file-label').innerText = 'Drop Any Supported File Here';
        document.getElementById('omni-status').innerText = 'Ready for transformation.';
      };

      window.removeImagePdfItem = (idx) => {
        imagePdfQueue.splice(idx, 1);
        renderImagePdfQueue();
      };

      function renderImagePdfQueue() {
        const container = document.getElementById('images-pdf-list');
        container.innerHTML = '';
        imagePdfQueue.forEach((item, i) => {
          const el = document.createElement('div');
          el.className = 'border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col items-center gap-1 text-[10px] font-mono-code relative group';
          el.innerHTML = `
            <button onclick="removeImagePdfItem(${i})" title="Remove photo" class="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow hover:bg-rose-600 transition">✕</button>
            <img src="${item.dataUrl}" class="h-16 w-full object-contain rounded" />
            <span class="truncate w-full text-center">${escapeHTML(item.name)}</span>
          `;
          container.appendChild(el);
        });
        if (imagePdfQueue.length === 0) {
          document.getElementById('images-pdf-controls').classList.add('hidden');
          document.getElementById('images-pdf-input').value = '';
        } else {
          document.getElementById('images-pdf-status').innerText = `${imagePdfQueue.length} images queued.`;
        }
      }


      // Comprehensive Clear & Cancel Handlers for ALL Tools
      window.clearPDFToWordFile = () => {
        targetFile = null;
        document.getElementById('real-pdf-input').value = '';
        document.getElementById('real-pdf-filename').innerText = '';
        document.getElementById('real-pdf-status').innerText = 'Awaiting file selection';
        const ind = document.getElementById('pdf-status-indicator');
        if (ind) ind.className = 'w-2 h-2 rounded-full bg-slate-300';
        document.getElementById('real-pdf-btn').disabled = true;
        document.getElementById('real-pdf-cancel-btn').classList.add('hidden');
      };

      window.clearExcelFile = () => {
        sheetData = [];
        document.getElementById('excel-file-input').value = '';
        document.getElementById('excel-filename').innerText = 'Select or Drop an Excel Spreadsheet (.xlsx, .xls, .csv)';
        document.getElementById('excel-preview-box').classList.add('hidden');
        document.getElementById('excel-table-preview').innerHTML = '';
        document.getElementById('excel-status').innerText = 'Awaiting spreadsheet data';
        document.getElementById('excel-convert-btn').disabled = true;
        document.getElementById('excel-cancel-btn').classList.add('hidden');
      };

      window.clearOrganizeFile = () => {
        rawSourceBuffer = null;
        rotations = [];
        deletedSet.clear();
        document.getElementById('organize-pdf-input').value = '';
        document.getElementById('organize-pages-grid').innerHTML = '';
        document.getElementById('organize-status').innerText = 'Awaiting document';
        document.getElementById('save-organize-btn').disabled = true;
        document.getElementById('organize-cancel-btn').classList.add('hidden');
      };

      window.clearProtectFile = () => {
        pProtectFile = null;
        document.getElementById('protect-pdf-input').value = '';
        document.getElementById('protect-pdf-name').innerText = '';
        document.getElementById('protect-user-pass').value = '';
        document.getElementById('protect-confirm-pass').value = '';
        document.getElementById('protect-status').innerText = 'Provide document and password';
        document.getElementById('protect-btn').disabled = true;
        document.getElementById('protect-cancel-btn').classList.add('hidden');
      };

      window.clearWatermarkFile = () => {
        wmBuf = null;
        document.getElementById('watermark-pdf-input').value = '';
        document.getElementById('watermark-pdf-name').innerText = '';
        document.getElementById('watermark-status').innerText = 'Awaiting document...';
        document.getElementById('watermark-btn').disabled = true;
        document.getElementById('watermark-cancel-btn').classList.add('hidden');
      };

      window.clearExtractFile = () => {
        extFile = null;
        document.getElementById('extract-pdf-input').value = '';
        document.getElementById('extract-pdf-name').innerText = '';
        document.getElementById('extract-status').innerText = 'Upload document to inspect graphics';
        document.getElementById('extract-btn').disabled = true;
        document.getElementById('extract-cancel-btn').classList.add('hidden');
      };

      window.renderMergeQueue = () => {
        const list = document.getElementById('merge-files-list');
        const btn = document.getElementById('merge-btn');
        const st = document.getElementById('merge-status');
        const cancelBtn = document.getElementById('merge-cancel-btn');

        if (mergeQueue.length === 0) {
          list.innerHTML = '';
          btn.disabled = true;
          cancelBtn.classList.add('hidden');
          st.innerText = 'Awaiting multiple PDF documents';
          return;
        }

        list.innerHTML = mergeQueue.map((f, i) => `
          <div class="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
            <span class="font-mono-code truncate max-w-xs sm:max-w-md">${i + 1}. ${escapeHTML(f.name)}</span>
            <div class="flex items-center gap-3">
              <span class="text-[#9AA3B8] font-mono-code">${(f.size / 1024).toFixed(1)} KB</span>
              <button onclick="removeMergeFileItem(${i})" title="Remove file" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50">✕</button>
            </div>
          </div>
        `).join('');

        cancelBtn.classList.remove('hidden');
        st.innerText = `${mergeQueue.length} documents ready.`;
        btn.disabled = mergeQueue.length < 2;
      };

      window.removeMergeFileItem = (idx) => {
        mergeQueue.splice(idx, 1);
        renderMergeQueue();
      };

      window.clearMergeFiles = () => {
        mergeQueue = [];
        document.getElementById('merge-files-input').value = '';
        renderMergeQueue();
      };

      window.clearSplitFile = () => {
        splitSourceBuffer = null;
        splitTotalPages = 0;
        document.getElementById('split-pdf-input').value = '';
        document.getElementById('split-pdf-filename').innerText = 'Select or Drop a PDF File to Split';
        document.getElementById('split-pdf-info').innerText = 'Pure in-browser memory extraction';
        document.getElementById('split-controls').classList.add('hidden');
        document.getElementById('split-cancel-btn').classList.add('hidden');
      };

      window.clearAllImagesPdf = () => {
        imagePdfQueue = [];
        document.getElementById('images-pdf-input').value = '';
        document.getElementById('images-pdf-list').innerHTML = '';
        document.getElementById('images-pdf-controls').classList.add('hidden');
        document.getElementById('images-pdf-cancel-btn').classList.add('hidden');
      };

      window.clearPageNumFile = () => {
        pageNumBuffer = null;
        document.getElementById('pagenum-pdf-input').value = '';
        document.getElementById('pagenum-file-label').innerText = 'Select or Drop a PDF File';
        document.getElementById('pagenum-controls').classList.add('hidden');
        document.getElementById('pagenum-cancel-btn').classList.add('hidden');
      };

      window.clearHashFile = () => {
        currentHashSha256 = '';
        document.getElementById('hash-file-input').value = '';
        document.getElementById('hash-file-label').innerText = 'Select or Drop Any Document or File';
        document.getElementById('hash-results').classList.add('hidden');
        document.getElementById('hash-cancel-btn').classList.add('hidden');
        document.getElementById('hash-sha256-val').innerText = '';
        document.getElementById('hash-sha1-val').innerText = '';
        document.getElementById('hash-compare-input').value = '';
        document.getElementById('hash-compare-status').innerHTML = '';
      };

      // Keyboard Shortcut
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          document.getElementById('tool-search-input').focus();
        }
      });

      // ========================================================
      // ULTRA LUXURY LIVE ENVIRONMENT MOTION ENGINE (60 FPS)
      // ========================================================
      (function initLuxuryEnvironment() {
        const canvas = document.getElementById('ambient-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let animId = null;
        let isRunning = true;

        const mouse = {
          x: -1000,
          y: -1000,
          targetX: -1000,
          targetY: -1000,
          radius: 190,
          active: false
        };

        window.addEventListener('mousemove', (e) => {
          mouse.targetX = e.clientX;
          mouse.targetY = e.clientY;
          mouse.active = true;

          // Update dynamic spotlight gradient on studio plaques
          document.querySelectorAll('.studio-plaque').forEach((card) => {
            const rect = card.getBoundingClientRect();
            if (
              e.clientX >= rect.left - 60 &&
              e.clientX <= rect.right + 60 &&
              e.clientY >= rect.top - 60 &&
              e.clientY <= rect.bottom + 60
            ) {
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              card.style.setProperty('--mouse-x', `${x}px`);
              card.style.setProperty('--mouse-y', `${y}px`);
            }
          });
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
          mouse.active = false;
          mouse.targetX = -1000;
          mouse.targetY = -1000;
        });

        // 1. Organic Radiant Plasma Orbs (Volumetric Background Glow)
        const orbs = [
          { x: 0.25, y: 0.22, r: 440, baseR: 440, color: 'rgba(79, 70, 229, 0.14)', vx: 0.0003, vy: 0.0002, phase: 0 },
          { x: 0.75, y: 0.28, r: 480, baseR: 480, color: 'rgba(59, 130, 246, 0.12)', vx: -0.0002, vy: 0.0003, phase: 2 },
          { x: 0.45, y: 0.75, r: 460, baseR: 460, color: 'rgba(168, 85, 247, 0.10)', vx: 0.0002, vy: -0.0002, phase: 4 },
          { x: 0.85, y: 0.82, r: 400, baseR: 400, color: 'rgba(236, 72, 153, 0.07)', vx: -0.0003, vy: -0.0002, phase: 1 }
        ];

        // 2. Interactive Constellation Stardust Particles
        const particleCount = window.innerWidth < 768 ? 40 : 75;
        const particles = [];

        function resetParticles() {
          particles.length = 0;
          for (let i = 0; i < particleCount; i++) {
            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 0.45,
              vy: (Math.random() - 0.5) * 0.45,
              size: Math.random() * 1.8 + 0.8,
              alpha: Math.random() * 0.5 + 0.2,
              baseAlpha: Math.random() * 0.5 + 0.2,
              pulseSpeed: Math.random() * 0.02 + 0.01,
              pulsePhase: Math.random() * Math.PI * 2
            });
          }
        }

        // 3. Upward Floating Cosmic Micro-Sparks
        const sparkCount = window.innerWidth < 768 ? 15 : 30;
        const sparks = [];
        function resetSparks() {
          sparks.length = 0;
          for (let i = 0; i < sparkCount; i++) {
            sparks.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vy: -(Math.random() * 0.35 + 0.15),
              swaySpeed: Math.random() * 0.02 + 0.01,
              swayAmp: Math.random() * 1.2 + 0.4,
              phase: Math.random() * Math.PI * 2,
              size: Math.random() * 1.2 + 0.5,
              alpha: Math.random() * 0.4 + 0.1
            });
          }
        }

        function resize() {
          width = window.innerWidth;
          height = window.innerHeight;
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          resetParticles();
          resetSparks();
        }
        window.addEventListener('resize', resize, { passive: true });
        resize();

        let lastTime = performance.now();

        function render(now) {
          if (!isRunning) return;
          lastTime = now;

          mouse.x += (mouse.targetX - mouse.x) * 0.1;
          mouse.y += (mouse.targetY - mouse.y) * 0.1;

          ctx.clearRect(0, 0, width, height);

          // LAYER 1: Radiant Plasma Orbs with Soft Volumetric Glow
          ctx.globalCompositeOperation = 'screen';
          orbs.forEach((orb) => {
            orb.phase += 0.008;
            orb.x += orb.vx;
            orb.y += orb.vy;

            if (orb.x < 0.1 || orb.x > 0.9) orb.vx *= -1;
            if (orb.y < 0.1 || orb.y > 0.9) orb.vy *= -1;

            const px = orb.x * width;
            const py = orb.y * height;
            const dynamicRadius = orb.baseR + Math.sin(orb.phase) * 35;

            const grad = ctx.createRadialGradient(px, py, 0, px, py, dynamicRadius);
            grad.addColorStop(0, orb.color);
            grad.addColorStop(0.5, orb.color.replace(/[\d\.]+\)$/, '0.04)'));
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, dynamicRadius, 0, Math.PI * 2);
            ctx.fill();
          });

          // LAYER 2: Constellation Network & Crystalline Connections
          ctx.globalCompositeOperation = 'lighter';

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            if (mouse.active) {
              const dx = p.x - mouse.x;
              const dy = p.y - mouse.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < mouse.radius && dist > 0) {
                const force = (1 - dist / mouse.radius) * 1.5;
                p.x += (dx / dist) * force;
                p.y += (dy / dist) * force;
                p.alpha = Math.min(1, p.baseAlpha + (1 - dist / mouse.radius) * 0.5);
              } else {
                p.alpha += (p.baseAlpha - p.alpha) * 0.05;
              }
            } else {
              p.pulsePhase += p.pulseSpeed;
              p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.15;
            }

            ctx.fillStyle = `rgba(199, 210, 254, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const maxDist = 110;

              if (dist < maxDist) {
                const lineAlpha = (1 - dist / maxDist) * 0.12 * Math.min(p.alpha, p2.alpha);
                ctx.strokeStyle = `rgba(165, 180, 252, ${lineAlpha})`;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }

            if (mouse.active) {
              const mdx = p.x - mouse.x;
              const mdy = p.y - mouse.y;
              const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
              if (mdist < 130) {
                const mouseAlpha = (1 - mdist / 130) * 0.22;
                ctx.strokeStyle = `rgba(129, 140, 248, ${mouseAlpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
              }
            }
          }

          // LAYER 3: Cosmic Micro-Sparks Drifting Upward
          for (let i = 0; i < sparks.length; i++) {
            const s = sparks[i];
            s.y += s.vy;
            s.phase += s.swaySpeed;
            s.x += Math.sin(s.phase) * s.swayAmp * 0.3;

            if (s.y < -10) {
              s.y = height + 10;
              s.x = Math.random() * width;
            }

            ctx.fillStyle = `rgba(224, 231, 255, ${s.alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalCompositeOperation = 'source-over';
          animId = requestAnimationFrame(render);
        }

        animId = requestAnimationFrame(render);

        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            isRunning = false;
            if (animId) cancelAnimationFrame(animId);
          } else {
            isRunning = true;
            lastTime = performance.now();
            animId = requestAnimationFrame(render);
          }
        });
      })();

      // Luxury Theme Controller
      window.toggleLuxuryTheme = () => {
        const isDark = document.body.classList.toggle('luxury-dark');
        const label = document.getElementById('theme-toggle-label');
        if (label) label.innerText = isDark ? 'Obsidian Live' : 'Platinum Live';
        localStorage.setItem('paperbytes_luxury_theme', isDark ? 'dark' : 'light');
      };

      (function applyInitialTheme() {
        const saved = localStorage.getItem('paperbytes_luxury_theme');
        const label = document.getElementById('theme-toggle-label');
        if (saved === 'light') {
          document.body.classList.remove('luxury-dark');
          if (label) label.innerText = 'Platinum Live';
        } else {
          document.body.classList.add('luxury-dark');
          if (label) label.innerText = 'Obsidian Live';
        }
      })();
    })();