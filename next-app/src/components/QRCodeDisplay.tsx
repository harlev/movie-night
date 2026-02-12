'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyQR() {
    const canvas = canvasWrapperRef.current?.querySelector('canvas');
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/png');
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      downloadQR();
    }
  }

  function downloadQR() {
    const canvas = canvasWrapperRef.current?.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'invite-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  const canvasSize = size * 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white rounded-lg p-3">
        <QRCodeSVG value={url} size={size} />
      </div>

      {/* Hidden canvas at 2x for high-res copy/download */}
      <div ref={canvasWrapperRef} className="hidden">
        <QRCodeCanvas value={url} size={canvasSize} marginSize={2} />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyQR}
          className="px-3 py-1.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm rounded-lg transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy QR
            </>
          )}
        </button>
        <button
          type="button"
          onClick={downloadQR}
          className="px-3 py-1.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}
