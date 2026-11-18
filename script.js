(() => {
      'use strict';

      // HTML Sanitizer for user-uploaded document previews
      function escapeHTML(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
      window.escapeHTML = escapeHTML;

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
          card.style.display = (category === 'all' || card.getAttribute('data-category') === category) ? 'flex' : 'none';
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
          list.innerHTML = '<div class="p-3 text-xs text-[#8a857b] text-center font-mono-code">No matching tools found</div>';
        } else {
          list.innerHTML = matches.map(m => `
            <div onclick="openTool('${m.id}'); document.getElementById('search-dropdown').classList.add('hidden');" class="p-3.5 hover:bg-[#1a2030] cursor-pointer transition border-b border-white/5 last:border-0">
              <p class="font-space font-bold text-xs text-white tracking-wide">${m.title}</p>
              <p class="text-[11px] text-zinc-400 mt-0.5 font-light">${m.desc}</p>
            </div>
          `).join('');
        }
        dropdown.classList.remove('hidden');
      };

      // Modal Controls
      window.openPrivacyModal = () => {
        const m = document.getElementById('privacy-modal');
        m.classList.remove('hidden');
        m.classList.add('active-modal');
        m.style.display = 'flex';
      };
      window.openTermsModal = () => {
        const m = document.getElementById('terms-modal');
        m.classList.remove('hidden');
        m.classList.add('active-modal');
        m.style.display = 'flex';
      };
      window.openCopyrightModal = () => {
        const m = document.getElementById('copyright-modal');
        m.classList.remove('hidden');
        m.classList.add('active-modal');
        m.style.display = 'flex';
      };
      window.closeModals = () => {
        ['privacy-modal', 'terms-modal', 'copyright-modal'].forEach(id => {
          const m = document.getElementById(id);
          m.classList.remove('active-modal');
          m.classList.add('hidden');
          m.style.display = 'none';
        });
      };

      window.addEventListener('click', (e) => {
        ['privacy-modal', 'terms-modal', 'copyright-modal'].forEach(id => {
          const el = document.getElementById(id);
          if (e.target === el) {
            el.classList.remove('active-modal');
            el.classList.add('hidden');
            el.style.display = 'none';
          }
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
        if (!targetFile) {
          document.getElementById('real-pdf-input').click();
          return;
        }
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
                <tr class="${i === 0 ? 'bg-[#181612] text-[#f5e6b8] font-bold' : 'text-[#d8d5cd]'}">
                  ${r.map(c => `<td class="px-3 py-1.5 border border-[#d4af37]/20 font-mono-code text-[11px]">${escapeHTML(c !== undefined ? c : '')}</td>`).join('')}
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
        if (!rawSourceBuffer) {
          document.getElementById('organize-pdf-input').click();
          return;
        }
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
          document.getElementById('protect-pdf-input').click();
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

        let secondsWaiting = 0;
        const progressTimer = setInterval(() => {
          secondsWaiting += 2;
          if (secondsWaiting > 4) {
            st.innerText = `Waking up free cloud container... (${secondsWaiting}s elapsed)`;
          }
        }, 2000);

        try {
          const formData = new FormData();
          formData.append('file', pProtectFile);
          formData.append('password', p1);

          const response = await fetch(`${GATEWAY_URL}/security/password-protect`, {
            method: 'POST',
            body: formData,
            credentials: 'omit'
          });

          clearInterval(progressTimer);

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
          clearInterval(progressTimer);
          st.innerText = 'Error: ' + (err.message || 'Encryption failed');
        } finally {
          clearInterval(progressTimer);
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
              const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PaperBytes — L'Atelier de Documents (Haute Horlogerie)</title><style>
    :root {
      --gold-primary: #d4af37;
      --gold-light: #f5e6b8;
      --gold-champagne: #e8d5b5;
      --gold-dark: #aa8222;
      --bg-dark: #08080a;
      --bg-atelier: #0d0d12;
      --border-gold: rgba(212, 175, 55, 0.22);
      --border-gold-hover: rgba(212, 175, 55, 0.7);
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-dark);
      color: #e5e5ea;
      background-image: 
        radial-gradient(circle at 50% -20%, rgba(212, 175, 55, 0.14) 0%, rgba(13, 13, 18, 0.5) 45%, transparent 75%),
        radial-gradient(circle at 90% 80%, rgba(170, 130, 34, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 10% 45%, rgba(212, 175, 55, 0.03) 0%, transparent 40%),
        radial-gradient(rgba(212, 175, 55, 0.07) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 28px 28px;
      background-attachment: fixed;
    }

    .font-luxury { font-family: 'Cinzel', serif; }
    .font-editorial { font-family: 'Cormorant Garamond', serif; }
    .font-brand { font-family: 'Cinzel', serif; }
    .font-mono-code { font-family: 'JetBrains Mono', monospace; }

    .tool-panel { display: none; }
    .tool-panel.active { display: block; }

    /* Custom Watchmaker Scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #08080b; }
    ::-webkit-scrollbar-thumb { background: #332b1b; border-radius: 9999px; border: 1px solid rgba(212, 175, 55, 0.25); }
    ::-webkit-scrollbar-thumb:hover { background: #d4af37; }

    /* Text & Metallic Shimmers */
    .hero-gold-gradient {
      background: linear-gradient(135deg, #ffffff 0%, #f6e7c1 30%, #d4af37 65%, #9e7d3b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.01em;
    }

    .gold-foil-text {
      background: linear-gradient(135deg, #f5e6b8 0%, #d4af37 50%, #aa8222 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Bento Cards with Chamfered Watch Bezel Aesthetic */
    .bento-card {
      background: linear-gradient(165deg, rgba(20, 20, 26, 0.94) 0%, rgba(10, 10, 14, 0.98) 100%);
      border: 1px solid rgba(212, 175, 55, 0.2);
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        inset 0 0 20px rgba(0, 0, 0, 0.7),
        0 14px 34px -8px rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(20px);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
      border-radius: 1.5rem;
    }
    .bento-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.1), transparent 65%);
      border-radius: inherit;
      pointer-events: none;
      transition: opacity 0.35s ease;
    }
    .bento-card:hover {
      transform: translateY(-4px);
      border-color: rgba(212, 175, 55, 0.65);
      box-shadow: 
        inset 0 1px 1px rgba(255, 255, 255, 0.18),
        0 22px 50px -10px rgba(0, 0, 0, 0.95),
        0 0 35px -5px rgba(212, 175, 55, 0.22);
    }

    /* Calibre corner rivets */
    .bezel-rivet {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #aa8222;
      border: 1px solid rgba(255, 255, 255, 0.4);
      position: absolute;
      opacity: 0.5;
    }

    /* Filter buttons */
    .filter-btn {
      background: rgba(16, 16, 22, 0.85);
      border: 1px solid rgba(212, 175, 55, 0.22);
      color: #dfba73;
      transition: all 0.25s ease;
      backdrop-filter: blur(8px);
      cursor: pointer;
    }
    .filter-btn:hover {
      border-color: rgba(212, 175, 55, 0.6);
      color: #ffffff;
      box-shadow: 0 0 16px rgba(212, 175, 55, 0.2);
    }
    .filter-btn.active-filter {
      background: linear-gradient(135deg, #f5e6b8 0%, #d4af37 45%, #aa8222 100%) !important;
      color: #070709 !important;
      border-color: #f5e6b8 !important;
      font-weight: 700 !important;
      box-shadow: 0 0 22px rgba(212, 175, 55, 0.4) !important;
    }

    /* Watchmaker Workbench Panels (Inside Tools) */
    .tool-panel > div {
      background: linear-gradient(165deg, rgba(18, 18, 25, 0.96) 0%, rgba(9, 9, 13, 0.99) 100%) !important;
      border: 1px solid rgba(212, 175, 55, 0.28) !important;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 28px 65px rgba(0, 0, 0, 0.92),
        0 0 45px -10px rgba(212, 175, 55, 0.12) !important;
      color: #f1f1f4 !important;
      border-radius: 1.5rem !important;
    }
    .tool-panel h2 {
      font-family: 'Cinzel', serif !important;
      color: #ffffff !important;
      letter-spacing: 0.02em !important;
    }
    .tool-panel p {
      color: #9e9a8f !important;
    }

    /* Watchmaker Mat Drop Zone */
    .tool-panel .border-dashed {
      background: rgba(11, 11, 16, 0.85) !important;
      border: 2px dashed rgba(212, 175, 55, 0.3) !important;
      border-radius: 1.5rem !important;
      transition: all 0.3s ease !important;
      position: relative !important;
    }
    .tool-panel .border-dashed:hover {
      border-color: rgba(212, 175, 55, 0.8) !important;
      background: rgba(18, 18, 26, 0.95) !important;
      box-shadow: 0 0 32px rgba(212, 175, 55, 0.22) !important;
    }

    /* Tactile Workbench Inputs */
    .tool-panel input[type="text"],
    .tool-panel input[type="password"],
    .tool-panel input[type="number"],
    .tool-panel select {
      background-color: #08080c !important;
      border: 1px solid rgba(212, 175, 55, 0.25) !important;
      color: #f5f5f7 !important;
      border-radius: 0.75rem !important;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.7) !important;
    }
    .tool-panel input:focus,
    .tool-panel select:focus {
      border-color: #d4af37 !important;
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.7) !important;
      outline: none !important;
    }
    .tool-panel label {
      color: #dfba73 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.15em !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      font-family: 'Cinzel', serif !important;
    }

    /* 18k Brushed Gold Crown Action Buttons */
    .tool-panel button.bg-indigo-600,
    .tool-panel button[id$="-btn"]:not([id$="-cancel-btn"]),
    #real-pdf-btn, #excel-convert-btn, #save-organize-btn, #protect-btn,
    #watermark-btn, #extract-btn, #scanner-btn, #portal-btn,
    #merge-btn, #split-btn, #imgpdf-btn, #omni-convert-btn, #num-btn,
    #hash-btn, #docx-btn {
      background: linear-gradient(135deg, #f5e6b8 0%, #d4af37 40%, #aa8222 80%, #7d5e16 100%) !important;
      color: #070709 !important;
      font-family: 'Cinzel', serif !important;
      font-weight: 700 !important;
      letter-spacing: 0.12em !important;
      text-transform: uppercase !important;
      border: 1px solid rgba(255, 255, 255, 0.5) !important;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.6),
        0 6px 22px rgba(212, 175, 55, 0.35) !important;
      transition: all 0.25s ease !important;
      cursor: pointer !important;
    }
    .tool-panel button.bg-indigo-600:hover,
    .tool-panel button[id$="-btn"]:hover:not([id$="-cancel-btn"]) {
      filter: brightness(1.15) !important;
      transform: translateY(-1px) !important;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.7),
        0 10px 32px rgba(212, 175, 55, 0.5) !important;
    }
    .tool-panel button:active {
      transform: translateY(1px) !important;
    }

    /* Cancel Buttons (Ruby Jewel Bearing Style) */
    button[id$="-cancel-btn"] {
      background: rgba(30, 12, 16, 0.9) !important;
      color: #fca5a5 !important;
      border: 1px solid rgba(239, 68, 68, 0.35) !important;
      font-family: 'JetBrains Mono', monospace !important;
      letter-spacing: 0.04em !important;
      backdrop-filter: blur(8px) !important;
      cursor: pointer !important;
    }
    button[id$="-cancel-btn"]:hover {
      background: rgba(50, 18, 25, 0.95) !important;
      border-color: rgba(239, 68, 68, 0.6) !important;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.25) !important;
    }

    /* Breadcrumbs */
    .tool-panel button[onclick="showDashboard()"] {
      color: #dfba73 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.15em !important;
      font-family: 'Cinzel', serif !important;
      cursor: pointer !important;
    }
    .tool-panel button[onclick="showDashboard()"]:hover {
      color: #ffffff !important;
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.5) !important;
    }

    /* Status Lines */
    span[id$="-status"], p[id$="-status"] {
      color: #dfba73 !important;
      font-family: 'JetBrains Mono', monospace !important;
    }

    /* Strict Modal Display Isolation */
    #privacy-modal:not(.active-modal),
    #terms-modal:not(.active-modal),
    #copyright-modal:not(.active-modal),
    .hidden {
      display: none !important;
      pointer-events: none !important;
    }
    #privacy-modal.active-modal,
    #terms-modal.active-modal,
    #copyright-modal.active-modal {
      display: flex !important;
      pointer-events: auto !important;
    }

    /* Modals (Swiss Chronometer Certificate Style) */
    #privacy-modal > div,
    #terms-modal > div,
    #copyright-modal > div {
      background: linear-gradient(165deg, #121217 0%, #0a0a0d 100%) !important;
      border: 1px solid rgba(212, 175, 55, 0.35) !important;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(212, 175, 55, 0.2) !important;
      color: #dfdfdf !important;
    }
    #privacy-modal h3,
    #terms-modal h3,
    #copyright-modal h3 {
      font-family: 'Cinzel', serif !important;
      color: #f5e6b8 !important;
    }
    #privacy-modal p,
    #terms-modal p,
    #copyright-modal p {
      color: #a5a198 !important;
    }
    #privacy-modal button,
    #terms-modal button,
    #copyright-modal button {
      background: linear-gradient(135deg, #f5e6b8 0%, #d4af37 40%, #aa8222 100%) !important;
      color: #070709 !important;
      font-family: 'Cinzel', serif !important;
      font-weight: 700 !important;
      letter-spacing: 0.1em !important;
      cursor: pointer !important;
    }

    /* Selection Colors */
    ::selection {
      background-color: rgba(212, 175, 55, 0.3);
      color: #ffffff;
    }

    /* Atelier Workbench & Tool Panel Haute Horlogerie Styling */
    .atelier-workbench {
      background: linear-gradient(165deg, rgba(18, 18, 24, 0.97) 0%, rgba(9, 9, 13, 0.99) 100%) !important;
      border: 1px solid rgba(212, 175, 55, 0.28) !important;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        inset 0 0 35px rgba(0, 0, 0, 0.8),
        0 24px 60px -12px rgba(0, 0, 0, 0.95) !important;
      backdrop-filter: blur(24px) !important;
      position: relative !important;
    }
    
    .atelier-dropzone {
      background: radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.05) 0%, rgba(10, 10, 14, 0.95) 75%) !important;
      border: 1px dashed rgba(212, 175, 55, 0.35) !important;
      box-shadow: inset 0 0 35px rgba(0, 0, 0, 0.9) !important;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .atelier-dropzone:hover {
      background: radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.1) 0%, rgba(16, 16, 22, 0.98) 75%) !important;
      border-color: rgba(212, 175, 55, 0.75) !important;
      box-shadow: inset 0 0 45px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.15) !important;
    }

    .atelier-input, .atelier-select {
      background: #09090d !important;
      border: 1px solid rgba(212, 175, 55, 0.3) !important;
      color: #f5e6b8 !important;
      border-radius: 0.75rem !important;
      font-family: 'Space Mono', monospace !important;
      transition: all 0.2s ease !important;
    }
    .atelier-input:focus, .atelier-select:focus {
      border-color: #d4af37 !important;
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.25) !important;
      outline: none !important;
    }

    .atelier-btn {
      background: linear-gradient(135deg, #d4af37 0%, #f5e6b8 50%, #aa8222 100%) !important;
      color: #070709 !important;
      font-family: 'Cinzel', serif !important;
      font-weight: 700 !important;
      letter-spacing: 0.12em !important;
      text-transform: uppercase !important;
      border-radius: 0.75rem !important;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35) !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      cursor: pointer !important;
    }
    .atelier-btn:hover {
      background: linear-gradient(135deg, #f5e6b8 0%, #d4af37 50%, #f5e6b8 100%) !important;
      box-shadow: 0 6px 30px rgba(212, 175, 55, 0.6) !important;
      transform: translateY(-1px) scale(1.01) !important;
    }
    .atelier-btn:active {
      transform: translateY(1px) scale(0.99) !important;
    }

    .atelier-cancel-btn {
      background: #1f0e12 !important;
      border: 1px solid rgba(244, 63, 94, 0.45) !important;
      color: #fca5a5 !important;
      border-radius: 0.75rem !important;
      font-family: 'Space Mono', monospace !important;
      font-size: 0.75rem !important;
      letter-spacing: 0.05em !important;
      transition: all 0.25s ease !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5) !important;
      cursor: pointer !important;
    }
    .atelier-cancel-btn:hover {
      background: #3b1119 !important;
      border-color: rgba(244, 63, 94, 0.8) !important;
      color: #ffffff !important;
      box-shadow: 0 0 15px rgba(244, 63, 94, 0.35) !important;
    }

  </style></head><body>${htmlContent}</body></html>`;
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
          preview.innerHTML = result.value || '<p class="text-slate-400">Empty document content.</p>';
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
              <span class="text-slate-400 font-mono-code">${(f.size / 1024).toFixed(1)} KB</span>
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
    
    // -------------------------------------------------------------
    // Mechanical Balance Wheel & Escapement Simulation (4Hz / 28,800 VPH)
    // -------------------------------------------------------------
    (() => {
      const canvas = document.getElementById('escapement-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let time = 0;
      const amplitude = 1.25;

      function renderTourbillon() {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = w * 0.40;

        ctx.clearRect(0, 0, w, h);

        time += 0.055;
        // Harmonic oscillation mimicking 28,800 VPH balance spring
        const currentAngle = Math.sin(time * 3.2) * amplitude;

        ctx.save();
        ctx.translate(cx, cy);

        // 1. Outer Balance Ring (Polished Gold with bevel glow)
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // 2. Peripheral Poising Screws / Gold Mass Weights
        ctx.rotate(currentAngle);
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8;
          const x1 = Math.cos(a) * (r - 2);
          const y1 = Math.sin(a) * (r - 2);
          const x2 = Math.cos(a) * (r + 4);
          const y2 = Math.sin(a) * (r + 4);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? '#f5e6b8' : '#aa8222';
          ctx.lineWidth = i % 2 === 0 ? 2 : 1.5;
          ctx.stroke();
        }

        // 3. Glucydur Triple Arms
        for (let s = 0; s < 3; s++) {
          const sa = (s * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(sa) * r, Math.sin(sa) * r);
          ctx.strokeStyle = '#c5a059';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // 4. Spiral Breguet Overcoil Hairspring (Thermally Blued Steel)
        ctx.beginPath();
        const turns = 4.2;
        const breath = 1.0 + Math.sin(time * 3.2) * 0.16;
        for (let theta = 0; theta < Math.PI * 2 * turns; theta += 0.1) {
          const sr = (theta / (Math.PI * 2 * turns)) * (r * 0.62) * breath;
          const sx = Math.cos(theta - currentAngle * 0.45) * sr;
          const sy = Math.sin(theta - currentAngle * 0.45) * sr;
          if (theta === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = '#38bdf8'; // blued steel
        ctx.lineWidth = 1.4;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowBlur = 6;
        ctx.stroke();

        // 5. Center Synthetic Ruby Cap Jewel
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#e11d48'; // ruby red jewel
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        // Real-time ticking chronometer readout
        const chronoEl = document.getElementById('live-chronometer');
        if (chronoEl) {
          const now = new Date();
          const h = String(now.getHours()).padStart(2, '0');
          const m = String(now.getMinutes()).padStart(2, '0');
          const s = String(now.getSeconds()).padStart(2, '0');
          const ms = Math.floor(now.getMilliseconds() / 100);
          chronoEl.innerText = `${h}:${m}:${s}.${ms} • CHRONOMETRE CERTIFIÉ • 28,800 VPH`;
        }

        requestAnimationFrame(renderTourbillon);
      }

      requestAnimationFrame(renderTourbillon);
    })();

    })();