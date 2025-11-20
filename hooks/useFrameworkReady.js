import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({ type: 'framework-ready' }, '*');
    }
  }, []);
}
