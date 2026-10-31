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

export const DocumentExportService = {
  /**
   * Print strictly the isolated preview element using a hidden iframe
   * ensuring zero outside elements or app UI leak into the print dialog
   */
  printIsolated(element: HTMLElement, settings: DocumentPageSettings, title: string) {
    // 1. Create hidden iframe
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
    const paperSizeCss = settings.paperSize === 'F4' ? '215mm 330mm' : 'A4';
    const orientationCss = settings.orientation;

    // Collect all head stylesheets
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    // Clone element and strip transforms
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${headStyles}
          <style>
            @page {
              size: ${paperSizeCss} ${orientationCss};
              margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .printable-document-root {
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
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

    // Trigger print after resources load
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
        }, 1000);
      }
    }, 450);
  },

  /**
   * Generate PDF Blob from rendered preview element
   */
  async generatePdfBlob(
    element: HTMLElement,
    settings: DocumentPageSettings
  ): Promise<Blob> {
    const margins = getMarginsInMm(settings);
    const dims = getPaperDimensionsInMm(settings);

    // Temporarily clone or measure element at full scale
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.width = `${dims.width}mm`;
    clone.style.minHeight = `${dims.height}mm`;
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.zIndex = '-1000';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2, // High resolution for crisp text & tables
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: settings.paperSize === 'F4' ? [215, 330] : 'a4',
      });

      const pdfWidth = dims.width;
      const pdfHeight = dims.height;

      // Fit content with margins
      const printableWidth = pdfWidth - (margins.left + margins.right);
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'JPEG',
        margins.left,
        margins.top,
        printableWidth,
        Math.min(imgHeight, pdfHeight - (margins.top + margins.bottom))
      );

      return pdf.output('blob');
    } finally {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
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
            size: 22, // 11pt
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
            size: 28, // 14pt
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${school.kopSubheader || school.address} | ${school.kopContact || `Telp: ${school.phone}`}`,
            size: 18, // 9pt
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
            size: 26, // 13pt
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
              size: 20, // 10pt
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

    // 4. MAIN DATA TABLE
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
                new Paragraph({ spacing: { after: 1200 }, children: [] }), // spacing for signature
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
                new Paragraph({ spacing: { after: 1200 }, children: [] }), // spacing for signature
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
      // Prompt user to connect
      const res = await signInWithFirebasePopup();
      token = res.accessToken;
    }

    // Ensure folder exists: Administrasi Guru - ${schoolName}
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
