'use client';

import { useEffect, useRef, useState } from 'react';

const TRANSITION_MS = 300;

// Crossfades between top-level screens instead of swapping them instantly.
// The outgoing screen stays mounted underneath (fully opaque) while the
// incoming one fades in on top, so PhoneFrame's own background is never
// exposed mid-navigation — no flash, in either direction. Keyed only on
// screenKey (the app's `screen` state), so prop-only updates within the
// same screen (e.g. reportData arriving) just refresh the top layer in
// place without retriggering a transition.
export default function ScreenTransition({ screenKey, children }) {
  const [layers, setLayers] = useState(() => [{ id: 0, node: children }]);
  const prevKeyRef = useRef(screenKey);
  const nextIdRef = useRef(1);

  useEffect(() => {
    if (screenKey === prevKeyRef.current) {
      setLayers((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { ...next[next.length - 1], node: children };
        return next;
      });
      return;
    }
    prevKeyRef.current = screenKey;
    const id = nextIdRef.current++;
    setLayers((prev) => [...prev, { id, node: children }]);
    const timer = setTimeout(() => {
      setLayers((prev) => prev.slice(-1));
    }, TRANSITION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey, children]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      {layers.map((layer) => (
        <div key={layer.id} className="absolute inset-0 flex flex-col" style={{ animation: 'fadeIn 0.3s ease' }}>
          {layer.node}
        </div>
      ))}
    </div>
  );
}
