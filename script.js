/**
 * PaperBytes - Modern Neon Document Converter
 * Client-Side Application Logic
 *
 * Supported formats: PDF, DOCX, XLSX, PPTX, JPG, PNG, TXT
 * Fully vanilla JavaScript, zero external dependencies.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Constants & Configuration
  // =========================================================================
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB Limit per file
  
  // Valid conversion targets per input extension
  const CONVERSION_TARGETS = {
    pdf: ['DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG', 'TXT'],
    docx: ['PDF', 'TXT', 'HTML', 'RTF'],
    xlsx: ['PDF', 'CSV', 'JSON'],
    pptx: ['PDF', 'JPG', 'PNG'],
    jpg: ['PNG', 'WEBP', 'PDF', 'AVIF'],
    jpeg: ['PNG', 'WEBP', 'PDF', 'AVIF'],
    png: ['JPG', 'WEBP', 'PDF', 'AVIF'],
    txt: ['PDF', 'DOCX', 'HTML']
  };

  const DEFAULT_TARGETS = ['PDF', 'DOCX', 'XLSX', 'JPG', 'PNG', 'TXT'];

  // =========================================================================
  // 2. Application State
  // =========================================================================
  let fileQueue = [];
  let currentFromFormat = 'PDF';
  let currentToFormat = 'DOCX';
  let conversionInterval = null;

  // =========================================================================
  // 3. DOM Elements
  // =========================================================================
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const chooseFileBtn = document.getElementById('chooseFileBtn');
  const fileQueueContainer = document.getElementById('fileQueue');
  const fileQueueList = document.getElementById('fileQueueList');
  const errorBanner = document.getElementById('errorBanner');
  const errorText = document.getElementById('errorText');
  const errorCloseBtn = document.getElementById('errorCloseBtn');

  const formatFromDisplay = document.getElementById('formatFromDisplay');
  const formatToSelect = document.getElementById('formatToSelect');
  const convertNowBtn = document.getElementById('convertNowBtn');

  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');

  const conversionStatusBox = document.getElementById('conversionStatusBox');
  const progressLabel = document.getElementById('progressLabel');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');

  const successView = document.getElementById('successView');
  const successTitle = document.getElementById('successTitle');
  const downloadBigBtn = document.getElementById('downloadBigBtn');
  const convertAnotherBtn = document.getElementById('convertAnotherBtn');

  // Modals
  const genericModal = document.getElementById('genericModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // =========================================================================
  // 4. Utility Functions
  // =========================================================================
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.add('visible');
    errorBanner.setAttribute('aria-hidden', 'false');
  }

  function clearError() {
    errorBanner.classList.remove('visible');
    errorBanner.setAttribute('aria-hidden', 'true');
    errorText.textContent = '';
  }

  // =========================================================================
  // 5. Step Indicator Workflow
  // =========================================================================
  function setStep(stepNumber) {
    // Reset all steps
    [step1, step2, step3].forEach(step => {
      step.classList.remove('active', 'completed');
    });

    if (stepNumber === 1) {
      step1.classList.add('active');
    } else if (stepNumber === 2) {
      step1.classList.add('completed');
      step2.classList.add('active');
    } else if (stepNumber === 3) {
      step1.classList.add('completed');
      step2.classList.add('completed');
      step3.classList.add('active');
    }
  }

  // =========================================================================
  // 6. File Queue & Format Synchronization
  // =========================================================================
  function updateTargetFormatDropdown(sourceExt) {
    const validTargets = CONVERSION_TARGETS[sourceExt] || DEFAULT_TARGETS;
    formatToSelect.innerHTML = '';

    validTargets.forEach(tgt => {
      const opt = document.createElement('option');
      opt.value = tgt;
      opt.textContent = tgt;
      formatToSelect.appendChild(opt);
    });

    // Default to the first available target
    currentToFormat = validTargets[0] || 'DOCX';
    formatToSelect.value = currentToFormat;
  }

  function renderFileQueue() {
    fileQueueList.innerHTML = '';

    if (fileQueue.length === 0) {
      fileQueueContainer.classList.remove('visible');
      convertNowBtn.disabled = true;
      formatFromDisplay.textContent = 'PDF';
      updateTargetFormatDropdown('pdf');
      setStep(1);
      return;
    }

    fileQueueContainer.classList.add('visible');
    convertNowBtn.disabled = false;
    setStep(2);

    fileQueue.forEach((file, index) => {
      const ext = getFileExtension(file.name);
      const card = document.createElement('div');
      card.className = 'file-card';
      card.innerHTML = `
        <div class="file-info">
          <span class="file-format-badge">${escapeHTML(ext.toUpperCase() || 'FILE')}</span>
          <div class="file-details">
            <span class="file-name" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
          </div>
        </div>
        <button type="button" class="btn-icon-remove" data-index="${index}" aria-label="Remove ${escapeHTML(file.name)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      card.querySelector('.btn-icon-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(index);
      });

      fileQueueList.appendChild(card);
    });

    // Auto-detect format from the most recent or primary file in queue
    const primaryExt = getFileExtension(fileQueue[0].name);
    currentFromFormat = primaryExt.toUpperCase();
    formatFromDisplay.textContent = currentFromFormat;
    updateTargetFormatDropdown(primaryExt);
  }

  function handleFiles(files) {
    clearError();
    const newFiles = Array.from(files);

    for (const file of newFiles) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        showError(`"${file.name}" exceeds the 25MB maximum file size limit.`);
        return;
      }

      const ext = getFileExtension(file.name);
      if (!CONVERSION_TARGETS[ext] && !['jpeg', 'jpg'].includes(ext)) {
        showError(`"${file.name}" has an unsupported format. Supported formats: PDF, DOCX, XLSX, PPTX, JPG, PNG, TXT.`);
        return;
      }

      // Avoid exact duplicate additions
      const isDuplicate = fileQueue.some(f => f.name === file.name && f.size === file.size);
      if (!isDuplicate) {
        fileQueue.push(file);
      }
    }

    renderFileQueue();
  }

  function removeFile(index) {
    fileQueue.splice(index, 1);
    renderFileQueue();
  }

  // =========================================================================
  // 7. Drag-and-Drop & File Picker Event Listeners
  // =========================================================================
  // Prevent browser default drag behavior on whole document
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, e => e.preventDefault(), false);
  });

  // Dropzone drag highlights
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
  });

  // Handle dropped files
  dropZone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFiles(dt.files);
    }
  });

  // Click drop zone or choose file button
  chooseFileBtn.addEventListener('click', e => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Keyboard accessibility for dropzone (Enter / Space to open file picker)
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      fileInput.value = ''; // Reset input to allow re-uploading identical filename
    }
  });

  errorCloseBtn.addEventListener('click', clearError);

  formatToSelect.addEventListener('change', e => {
    currentToFormat = e.target.value;
  });

  // =========================================================================
  // 8. Conversion Simulation Flow
  // =========================================================================
  convertNowBtn.addEventListener('click', () => {
    if (fileQueue.length === 0) {
      showError('Please upload at least one document before converting.');
      return;
    }

    clearError();
    startConversionFlow();
  });

  function startConversionFlow() {
    // Disable controls while converting
    convertNowBtn.disabled = true;
    chooseFileBtn.disabled = true;
    dropZone.style.pointerEvents = 'none';

    // Show Progress State
    conversionStatusBox.classList.add('visible');
    successView.classList.remove('visible');
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressLabel.textContent = `Preparing ${fileQueue.length} document${fileQueue.length > 1 ? 's' : ''}...`;

    let progress = 0;
    clearInterval(conversionInterval);

    /**
     * =======================================================================
     * TODO: Backend API Integration
     * Replace the simulated timer below with a real fetch call to your server:
     *
     * Example:
     * const formData = new FormData();
     * fileQueue.forEach(f => formData.append('files', f));
     * formData.append('target_format', currentToFormat);
     * 
     * const response = await fetch('/api/convert', {
     *   method: 'POST',
     *   body: formData
     * });
     * const blob = await response.blob();
     * =======================================================================
     */

    conversionInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 8;

      if (progress < 40) {
        progressLabel.textContent = 'Analyzing document layout & vector fonts...';
      } else if (progress < 75) {
        progressLabel.textContent = `Transcoding structures to ${currentToFormat}...`;
      } else if (progress < 95) {
        progressLabel.textContent = 'Packaging optimized output file...';
      }

      if (progress >= 100) {
        progress = 100;
        clearInterval(conversionInterval);
        progressBarFill.style.width = '100%';
        progressPercent.textContent = '100%';

        setTimeout(() => {
          onConversionComplete();
        }, 300);
      } else {
        progressBarFill.style.width = `${progress}%`;
        progressPercent.textContent = `${progress}%`;
      }
    }, 180);
  }

  function onConversionComplete() {
    setStep(3);
    conversionStatusBox.classList.remove('visible');
    successView.classList.add('visible');

    const count = fileQueue.length;
    successTitle.textContent = count === 1 
      ? `Your ${currentToFormat} is ready!` 
      : `${count} files converted to ${currentToFormat}!`;

    downloadBigBtn.textContent = count === 1
      ? `Download .${currentToFormat}`
      : `Download Batch Archive (.ZIP)`;
  }

  // Download Trigger (Simulated for client-side prototype)
  downloadBigBtn.addEventListener('click', () => {
    if (fileQueue.length === 0) return;

    fileQueue.forEach(file => {
      const base = file.name.replace(/\.[^/.]+$/, '');
      const outName = `${base}.${currentToFormat.toLowerCase()}`;
      
      // Generate clean simulated output blob
      const simulatedBlob = new Blob([
        `PaperBytes Conversion Output\nSource: ${file.name}\nTarget: ${currentToFormat}\nGenerated: ${new Date().toISOString()}`
      ], { type: 'application/octet-stream' });

      const url = URL.createObjectURL(simulatedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });

  // "Convert another file" reset
  convertAnotherBtn.addEventListener('click', () => {
    resetConverter();
  });

  function resetConverter() {
    clearInterval(conversionInterval);
    fileQueue = [];
    dropZone.style.pointerEvents = 'auto';
    chooseFileBtn.disabled = false;
    convertNowBtn.disabled = true;
    conversionStatusBox.classList.remove('visible');
    successView.classList.remove('visible');
    clearError();
    renderFileQueue();
    setStep(1);
  }

  // =========================================================================
  // 9. Format Chips Interaction
  // =========================================================================
  document.querySelectorAll('.format-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetFmt = chip.getAttribute('data-format');
      if (targetFmt === 'more') {
        openGenericModal('Supported Document Formats', `
          <p style="color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; margin-bottom: 16px;">
            PaperBytes supports 50+ document, tabular, vector, presentation, and image formats:
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${['PDF', 'DOCX', 'DOC', 'XLSX', 'XLS', 'CSV', 'PPTX', 'PPT', 'TXT', 'RTF', 'ODT', 'ODS', 'ODP', 'JPG', 'PNG', 'WEBP', 'SVG', 'TIFF', 'BMP', 'EPS', 'JSON', 'XML', 'MD', 'HTML'].map(f => `
              <span style="background: var(--surface-inner); border: 1px solid var(--border-subtle); color: var(--accent-lime); padding: 4px 10px; border-radius: 6px; font-family: var(--font-heading); font-size: 0.8125rem; font-weight: 700;">${f}</span>
            `).join('')}
          </div>
        `);
      } else {
        // Pre-select format in converter
        currentToFormat = targetFmt;
        formatToSelect.value = targetFmt;
        dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // =========================================================================
  // 10. Modals & Cloud Connectors
  // =========================================================================
  function openGenericModal(title, htmlContent) {
    modalTitle.textContent = title;
    modalBody.innerHTML = htmlContent;
    genericModal.classList.add('open');
    genericModal.setAttribute('aria-hidden', 'false');
  }

  function closeGenericModal() {
    genericModal.classList.remove('open');
    genericModal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';
  }

  modalCloseBtn.addEventListener('click', closeGenericModal);

  genericModal.addEventListener('click', e => {
    if (e.target === genericModal) {
      closeGenericModal();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && genericModal.classList.contains('open')) {
      closeGenericModal();
    }
  });




  // Initialize Default State
  renderFileQueue();
  updateTargetFormatDropdown('pdf');
})();
