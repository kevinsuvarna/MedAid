'use client';

import { useState } from 'react';
import { publicClient as supabaseClient } from '@/lib/supabaseClient';

export default function WriteNfcPage() {
  const [pdfUrl, setPdfUrl] = useState('');
  const [status, setStatus] = useState({ type: 'idle' });

  async function handleWrite() {
    if (!('NDEFReader' in window)) {
      setStatus({ type: 'error', message: 'Web NFC not supported. Use Chrome on Android.' });
      return;
    }

    const uuid = crypto.randomUUID();
    const appUrl = `https://med-aid-1cpm.vercel.app/?report_id=${uuid}`;

    setStatus({ type: 'writing' });

    try {
      const ndef = new NDEFReader();
      await Promise.all([
        ndef.write({ records: [{ recordType: 'url', data: appUrl }] }),
        supabaseClient.from('reports').insert({ id: uuid, pdf_url: pdfUrl }),
      ]);
      setStatus({ type: 'done', appUrl });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-md mx-auto mt-16">
      <div className="text-xl font-semibold mb-6">Write NFC Tag</div>

      <textarea
        placeholder="Paste Supabase PDF URL"
        value={pdfUrl}
        onChange={(e) => setPdfUrl(e.target.value)}
        className="w-full border rounded-lg p-3 mb-4 text-sm"
      />

      <button
        onClick={handleWrite}
        disabled={status.type === 'writing'}
        className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium"
      >
        Generate &amp; Write NFC
      </button>

      <div className="mt-4">
        {status.type === 'writing' && (
          <div className="text-amber-600">Hold sticker to back of phone…</div>
        )}
        {status.type === 'done' && (
          <div>
            <input
              type="text"
              readOnly
              value={status.appUrl}
              onClick={(e) => e.target.select()}
              className="w-full border rounded-lg p-3 mb-2 text-sm"
            />
            <div className="text-green-600">Done ✓</div>
          </div>
        )}
        {status.type === 'error' && (
          <div className="text-red-500">{status.message}</div>
        )}
      </div>
    </div>
  );
}
