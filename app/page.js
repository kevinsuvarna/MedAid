'use client';

import { Suspense } from 'react';
import CbcApp from '@/components/CbcApp';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CbcApp />
    </Suspense>
  );
}
