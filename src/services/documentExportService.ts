import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { SchoolProfile, User } from '../types';
import { GoogleWorkspaceService } from './googleWorkspaceService';
import { getCachedWorkspaceToken, signInWithFirebasePopup } from '../firebase';

export type PaperSize = 'A4' | 'F4';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginOption = 'normal' | 'narrow' | 'moderate' | 'custom';
export type ExportFormat = 'pdf' | 'docx';

export interface DocumentPageSettings {
  paperSize: PaperSize;
  orientation: PageOrientation;
  marginOption: MarginOption;
  customMargins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const DEFAULT_PAGE_SETTINGS: DocumentPageSettings = {
  paperSize: 'A4',
  orientation: 'portrait',
  marginOption: 'normal',
  customMargins: { top: 25, bottom: 25, left: 25, right: 25 },
};

export function getMarginsInMm(settings: DocumentPageSettings) {
  if (settings.marginOption === 'narrow') {
    return { top: 15, bottom: 15, left: 15, right: 15 };
  }
  if (settings.marginOption === 'moderate') {
    return { top: 20, bottom: 20, left: 20, right: 20 };
  }
  if (settings.marginOption === 'custom' && settings.customMargins) {
    return settings.customMargins;
  }
  // Normal default is 25mm (~2.5cm)
  return { top: 25, bottom: 25, left: 25, right: 25 };
}

export function getPaperDimensionsInMm(settings: DocumentPageSettings) {
  const baseWidth = settings.paperSize === 'F4' ? 215 : 210;
  const baseHeight = settings.paperSize === 'F4' ? 330 : 297;

  if (settings.orientation === 'landscape') {
    return { width: baseHeight, height: baseWidth };
  }
  return { width: baseWidth, height: baseHeight };
}

/**
 * Clean CSS used for isolated printing and PDF generation
 * Contains ONLY standard HEX/RGB colors — completely free of Tailwind v4 oklch()
 */
function getIsolatedDocumentCss(
  dims: { width: number; height: number },
  margins: { top: number; bottom: number; left: number; right: number },
  isPrint: boolean = false
) {
  return `
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-scheme: light !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif !important;
      -webkit-font-smoothing: antialiased;
    }
    #print-root, #capture-container {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .printable-document-root {
      width: ${isPrint ? '100%' : `${dims.width - (margins.left + margins.right)}mm`} !important;
      max-width: 100% !important;
      min-height: ${isPrint ? 'auto' : `${dims.height - (margins.top + margins.bottom)}mm`} !important;
      padding: ${isPrint ? '0' : '0'} !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      margin: 0 auto !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
      font-size: 11px !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
    }
    th, td {
      border: 1px solid #000000 !important;
      padding: 5px 6px !important;
      color: #000000 !important;
    }
    thead {
      display: table-header-group !important;
    }
    tfoot {
      display: table-footer-group !important;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    thead tr, th, .bg-slate-100 {
      background-color: #f1f5f9 !important;
      color: #000000 !important;
      font-weight: bold !important;
    }
    .bg-slate-50 {
      background-color: #f8fafc !important;
      background: #f8fafc !important;
    }
    .bg-slate-200 {
      background-color: #e2e8f0 !important;
      background: #e2e8f0 !important;
    }
    .bg-white {
      background-color: #ffffff !important;
      background: #ffffff !important;
    }
    .bg-emerald-100 {
      background-color: #d1fae5 !important;
    }
    .bg-blue-50 {
      background-color: #eff6ff !important;
    }
    .bg-rose-50 {
      background-color: #fff1f2 !important;
    }
    .border-kop-dinas {
      border-bottom: 2px solid #000000 !important;
    }
    .border-b-2 { border-bottom-width: 2px !important; }
    .border-black { border-color: #000000 !important; }
    .border-b { border-bottom-width: 1px !important; }
    .border-slate-900 { border-color: #0f172a !important; }
    .border-slate-200 { border-color: #e2e8f0 !important; }
    .border-slate-300 { border-color: #cbd5e1 !important; }
    .border { border-width: 1px !important; border-style: solid !important; }
    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    .font-bold { font-weight: 700 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-extrabold { font-weight: 800 !important; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
    .font-serif { font-family: 'Times New Roman', Times, serif !important; }
    .font-sans { font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif !important; }
    .uppercase { text-transform: uppercase !important; }
    .underline { text-decoration: underline !important; }
    .text-xs { font-size: 11px !important; }
    .text-sm { font-size: 13px !important; }
    .text-base { font-size: 15px !important; }
    .text-lg { font-size: 17px !important; }
    .text-\\[9px\\] { font-size: 9px !important; }
    .text-\\[10px\\] { font-size: 10px !important; }
    .text-\\[11px\\] { font-size: 11px !important; }
    .text-\\[10\\.5pt\\] { font-size: 10.5pt !important; }
    .leading-tight { line-height: 1.25 !important; }
    .leading-snug { line-height: 1.375 !important; }
    .tracking-wide { letter-spacing: 0.025em !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-slate-950 { color: #020617 !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-600 { color: #475569 !important; }
    .text-slate-500 { color: #64748b !important; }
    .text-slate-400 { color: #94a3b8 !important; }
    .text-red-600, .text-rose-600 { color: #dc2626 !important; }
    .text-emerald-800 { color: #065f46 !important; }
    .text-emerald-700 { color: #047857 !important; }
    .text-emerald-600 { color: #059669 !important; }
    .text-blue-600 { color: #2563eb !important; }
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .gap-4 { gap: 16px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-1 { gap: 4px !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .gap-x-6 { column-gap: 24px !important; }
    .gap-y-1 { row-gap: 4px !important; }
    .my-3 { margin-top: 12px !important; margin-bottom: 12px !important; }
    .my-4 { margin-top: 16px !important; margin-bottom: 16px !important; }
    .mt-0\\.5 { margin-top: 2px !important; }
    .mt-1 { margin-top: 4px !important; }
    .mt-2 { margin-top: 8px !important; }
    .mt-6 { margin-top: 24px !important; }
    .mt-8 { margin-top: 32px !important; }
    .mb-5 { margin-bottom: 20px !important; }
    .mr-2 { margin-right: 8px !important; }
    .pt-2 { padding-top: 8px !important; }
    .pt-3 { padding-top: 12px !important; }
    .pt-4 { padding-top: 16px !important; }
    .pb-3 { padding-bottom: 12px !important; }
    .p-2\\.5 { padding: 10px !important; }
    .p-2 { padding: 8px !important; }
    .p-1\\.5 { padding: 6px !important; }
    .w-8 { width: 32px !important; }
    .w-32 { width: 128px !important; }
    .w-56 { width: 224px !important; }
    .h-20 { height: 80px !important; }
    .rounded { border-radius: 4px !important; }
    .rounded-lg { border-radius: 8px !important; }
    .break-inside-avoid {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .no-print {
      display: none !important;
    }
  `;
}

export const DocumentExportService = {
  /**
   * Print strictly the isolated preview element using a hidden iframe.
   * Completely excludes application background, modal backdrop, buttons, and sidebars.
   * Supports automatic multi-page breaks for long tables with repeated headers.
   */
  printIsolated(element: HTMLElement, settings: DocumentPageSettings, title: string) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const margins = getMarginsInMm(settings);
    const dims = getPaperDimensionsInMm(settings);
    const paperSizeCss = settings.paperSize === 'F4' ? '215mm 330mm' : 'A4';
    const orientationCss = settings.orientation;

    // Clone element and strip transforms, borders, shadows, and screen margins
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.padding = '0';
    clone.style.backgroundColor = '#ffffff';

    // Remove any modal or screen shadow classes
    clone.classList.remove('shadow-2xl', 'border', 'border-slate-300', 'rounded-lg');

    const cleanCss = getIsolatedDocumentCss(dims, margins, true);

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page {
              size: ${paperSizeCss} ${orientationCss};
              margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            }
            ${cleanCss}
          </style>
        </head>
        <body>
          <div id="print-root">
            ${clone.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after iframe renders
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Iframe print error:', e);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1200);
      }
    }, 400);
  },

  /**
   * Render preview element to canvas using an isolated iframe.
   * Completely immune to Tailwind v4 "oklch" error by:
   * 1. Operating in a separate iframe without Tailwind stylesheets.
   * 2. Installing a Proxy on getComputedStyle to intercept and replace any oklch(...) values.
   * 3. Sanitizing style nodes and elements in html2canvas onclone hook.
   */
  async renderElementToCanvas(
    element: HTMLElement,
    settings: DocumentPageSettings
  ): Promise<HTMLCanvasElement> {
    const margins = getMarginsInMm(settings);
    const dims = getPaperDimensionsInMm(settings);
    const printableWidthMm = dims.width - (margins.left + margins.right);
    const printableHeightMm = dims.height - (margins.top + margins.bottom);

    // Create isolated hidden iframe with pure Hex/RGB stylesheet (no oklch)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = `${printableWidthMm}mm`;
    iframe.style.height = 'auto';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      document.body.removeChild(iframe);
      throw new Error('Gagal menginisialisasi renderer dokumen.');
    }

    // Intercept window.getComputedStyle to ensure NO oklch color ever leaks to html2canvas
    const origGCS = win.getComputedStyle.bind(win);
    win.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const style = origGCS(elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop: string | symbol) {
          const val = Reflect.get(target, prop);
          if (typeof val === 'string' && val.includes('oklch')) {
            return val.replace(/oklch\([^)]+\)/g, '#0f172a');
          }
          if (typeof val === 'function') {
            return function (...args: any[]) {
              const res = (val as any).apply(target, args);
              if (typeof res === 'string' && res.includes('oklch')) {
                return res.replace(/oklch\([^)]+\)/g, '#0f172a');
              }
              return res;
            };
          }
          return val;
        },
      });
    };

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.width = `${printableWidthMm}mm`;
    clone.style.minHeight = `${printableHeightMm}mm`;
    clone.style.padding = '0';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#000000';

    clone.classList.remove('shadow-2xl', 'border', 'border-slate-300', 'rounded-lg');

    const cleanCss = getIsolatedDocumentCss(dims, margins, false);

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>${cleanCss}</style>
        </head>
        <body>
          <div id="capture-container">
            ${clone.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Allow browser to layout fonts & images
    await new Promise((resolve) => setTimeout(resolve, 250));

    const targetEl =
      (doc.getElementById('capture-container')?.firstElementChild as HTMLElement) || doc.body;

    try {
      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: targetEl.scrollWidth || printableWidthMm * 3.78,
        windowHeight: targetEl.scrollHeight || printableHeightMm * 3.78,
        onclone: (clonedDoc) => {
          // Double safety: Intercept cloned window getComputedStyle as well
          const clonedWin = clonedDoc.defaultView;
          if (clonedWin) {
            const origClonedGCS = clonedWin.getComputedStyle.bind(clonedWin);
            clonedWin.getComputedStyle = function (elt: Element, pseudo?: string | null) {
              const s = origClonedGCS(elt, pseudo);
              return new Proxy(s, {
                get(target, prop) {
                  const v = Reflect.get(target, prop);
                  if (typeof v === 'string' && v.includes('oklch')) {
                    return v.replace(/oklch\([^)]+\)/g, '#0f172a');
                  }
                  if (typeof v === 'function') {
                    return function (...args: any[]) {
                      const r = (v as any).apply(target, args);
                      if (typeof r === 'string' && r.includes('oklch')) {
                        return r.replace(/oklch\([^)]+\)/g, '#0f172a');
                      }
                      return r;
                    };
                  }
                  return v;
                },
              });
            };
          }

          // Double safety: sanitize all <style> elements
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach((s) => {
            if (s.textContent && s.textContent.includes('oklch')) {
              s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#0f172a');
            }
          });

          // Walk all elements and sanitize any inline style properties
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((node) => {
            const el = node as HTMLElement;
            if (el.style) {
              for (let i = 0; i < el.style.length; i++) {
                const prop = el.style[i];
                const val = el.style.getPropertyValue(prop);
                if (val && val.includes('oklch')) {
                  el.style.setProperty(prop, '#0f172a', 'important');
                }
              }
            }
          });
        },
      });
      return canvas;
    } finally {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  },

  /**
   * Generate PDF Blob from rendered preview element.
   * Supports automatic page additions (multi-page) when content exceeds page height!
   */
  async generatePdfBlob(
    element: HTMLElement,
    settings: DocumentPageSettings
  ): Promise<Blob> {
    const margins = getMarginsInMm(settings);
    const dims = getPaperDimensionsInMm(settings);
    const printableWidth = dims.width - (margins.left + margins.right);
    const printableHeight = dims.height - (margins.top + margins.bottom);

    // Render canvas via clean isolated iframe (zero oklch errors)
    const canvas = await this.renderElementToCanvas(element, settings);

    const pdf = new jsPDF({
      orientation: settings.orientation,
      unit: 'mm',
      format: settings.paperSize === 'F4' ? [215, 330] : 'a4',
    });

    // Pixels per mm in the rendered canvas
    const pxPerMm = canvas.width / printableWidth;
    const totalContentHeightMm = canvas.height / pxPerMm;

    if (totalContentHeightMm <= printableHeight + 2) {
      // 1-Page Document
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(
        imgData,
        'JPEG',
        margins.left,
        margins.top,
        printableWidth,
        totalContentHeightMm
      );

      // Running footer page number
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        'Dokumen Resmi SMAN 1 Gowa · Halaman 1 dari 1',
        dims.width - margins.right,
        dims.height - Math.max(6, margins.bottom * 0.4),
        { align: 'right' }
      );
    } else {
      // Multi-Page Document: Halaman otomatis bertambah sesuai ukuran konten!
      const pageHeightPx = Math.floor(printableHeight * pxPerMm);
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const sourceY = pageIdx * pageHeightPx;
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        // Create temporary slice canvas
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );
        }

        const sliceData = pageCanvas.toDataURL('image/jpeg', 0.95);

        if (pageIdx > 0) {
          pdf.addPage(settings.paperSize === 'F4' ? [215, 330] : 'a4', settings.orientation);
        }

        pdf.addImage(
          sliceData,
          'JPEG',
          margins.left,
          margins.top,
          printableWidth,
          sliceHeightMm
        );

        // Add running footer page number
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          `Dokumen Resmi SMAN 1 Gowa · Halaman ${pageIdx + 1} dari ${totalPages}`,
          dims.width - margins.right,
          dims.height - Math.max(6, margins.bottom * 0.4),
          { align: 'right' }
        );
      }
    }

    return pdf.output('blob');
  },

  /**
   * Generate Word DOCX Blob from document structure
   */
  async generateDocxBlob(
    school: SchoolProfile,
    currentUser: User | null,
    title: string,
    subtitle: string | undefined,
    metaInfo: Array<{ label: string; value: string }>,
    tableHeaders: string[],
    tableRows: string[][],
    settings: DocumentPageSettings
  ): Promise<Blob> {
    const margins = getMarginsInMm(settings);
    // Convert mm to twips (1 mm ≈ 56.7 twips)
    const topTwips = Math.round(margins.top * 56.7);
    const bottomTwips = Math.round(margins.bottom * 56.7);
    const leftTwips = Math.round(margins.left * 56.7);
    const rightTwips = Math.round(margins.right * 56.7);

    const docChildren: any[] = [];

    // 1. KOP SURAT PARAGRAPHS
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: school.kopHeader1 || 'PEMERINTAH PROVINSI SULAWESI SELATAN',
            bold: true,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: school.kopHeader2 || 'DINAS PENDIDIKAN',
            bold: true,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    if (school.kopHeader3) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: school.kopHeader3,
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    }

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: school.kopHeader4 || school.name || 'UPT SMA NEGERI 1 GOWA',
            bold: true,
            size: 28,
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${school.kopSubheader || school.address} | ${school.kopContact || `Telp: ${school.phone}`}`,
            size: 18,
            font: 'Arial',
          }),
        ],
      }),
      // Divider line
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '═══════════════════════════════════════════════════════════════════════',
            bold: true,
            size: 16,
          }),
        ],
      })
    );

    // 2. DOCUMENT TITLE
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            underline: {},
            size: 26,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    if (subtitle) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: subtitle,
              italics: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        })
      );
    }

    // 3. META INFO TABLE
    if (metaInfo.length > 0) {
      const metaRows = metaInfo.map(
        (info) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 3000, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: info.label, bold: true, size: 20, font: 'Arial' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 500, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })],
              }),
              new TableCell({
                width: { size: 5500, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: info.value, size: 20, font: 'Arial' }),
                    ],
                  }),
                ],
              }),
            ],
          })
      );

      docChildren.push(
        new Table({
          rows: metaRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        new Paragraph({ spacing: { after: 180 }, children: [] })
      );
    }

    // 4. MAIN DATA TABLE (Automatic Word pagination)
    if (tableHeaders.length > 0) {
      const headerRow = new TableRow({
        tableHeader: true,
        children: tableHeaders.map(
          (h) =>
            new TableCell({
              shading: { fill: 'EEEEEE' },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: h, bold: true, size: 19, font: 'Arial' })],
                }),
              ],
            })
        ),
      });

      const bodyRows = tableRows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cellText, colIdx) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment:
                        colIdx === 0 || colIdx === 1 || cellText.length <= 4
                          ? AlignmentType.CENTER
                          : AlignmentType.LEFT,
                      children: [new TextRun({ text: cellText || '-', size: 18, font: 'Arial' })],
                    }),
                  ],
                })
            ),
          })
      );

      docChildren.push(
        new Table({
          rows: [headerRow, ...bodyRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    // 5. SIGNATURES (Kepala Sekolah & Guru)
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const signTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({ children: [new TextRun({ text: 'Mengetahui,', size: 20 })] }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Kepala ${school.name || 'UPT SMA Negeri 1 Gowa'}`,
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({ spacing: { after: 1200 }, children: [] }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: school.headmaster || 'Drs. H. Arsyad, M.Pd.',
                      bold: true,
                      underline: {},
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `NIP. ${school.headmasterNip || '19680512 199412 1 002'}`,
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Sungguminasa, ${todayFormatted}`, size: 20 }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Guru Mata Pelajaran,',
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({ spacing: { after: 1200 }, children: [] }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: currentUser?.name || 'Andi Ismail, S.Pd.',
                      bold: true,
                      underline: {},
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `NIP. ${currentUser?.nip || '19880815 201403 1 004'}`,
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    docChildren.push(
      new Paragraph({ spacing: { before: 360 }, children: [] }),
      signTable
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: topTwips,
                bottom: bottomTwips,
                left: leftTwips,
                right: rightTwips,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    return await Packer.toBlob(doc);
  },

  /**
   * Download file directly to user device
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  /**
   * Upload and save directly to Google Drive in teacher's school folder
   */
  async uploadToGoogleDrive(
    blob: Blob,
    filename: string,
    schoolName: string
  ): Promise<{ fileId: string; fileName: string; webViewLink?: string; folderUrl?: string }> {
    let token = getCachedWorkspaceToken();
    if (!token) {
      const res = await signInWithFirebasePopup();
      token = res.accessToken;
    }

    const folderName = `Administrasi Guru - ${schoolName || 'SMAN 1 Gowa'}`;
    const folderId = await GoogleWorkspaceService.getOrCreateFolder(token, folderName);
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    const mimeType = filename.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    const uploaded = await GoogleWorkspaceService.uploadFileToDrive(
      token,
      filename,
      blob,
      mimeType,
      folderId
    );

    return {
      fileId: uploaded.id,
      fileName: uploaded.name,
      webViewLink: uploaded.webViewLink,
      folderUrl,
    };
  },
};
