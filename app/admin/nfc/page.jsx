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
      // Insert must land — and be confirmed — before the tag is ever written.
      // Racing these (e.g. via Promise.all) risks the physical tag ending up
      // with a URL whose row failed to commit; a tag write can't be undone,
      // so a report_id burned onto a tag must always resolve to a real row.
      const { error: insertError } = await supabaseClient.from('reports').insert({ id: uuid, pdf_url: pdfUrl });
      if (insertError) throw insertError;

      const ndef = new NDEFReader();
      // overwrite: true replaces the tag's entire NDEF message (any old
      // report_id/url record included) instead of appending to it — the
      // tag's hardware UID is separate and unrelated; this only clears its
      // stored content, which is the URL record we control.
      await ndef.write({ records: [{ recordType: 'url', data: appUrl }] }, { overwrite: true });
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
