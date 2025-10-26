import { useEffect, useRef } from 'react';
import { createTrace } from '../utils/performance';

/**
 * Custom hook to measure component render performance
 * @param componentName - Name of the component to trace
 * @param enabled - Whether tracing is enabled (default: true)
 */
export function usePerformanceTrace(componentName: string, enabled: boolean = true) {
  const traceRef = useRef<ReturnType<typeof createTrace>>(null);

  useEffect(() => {
    if (!enabled) return;

    const trace = createTrace(`component_${componentName}`);
    if (!trace) return;

    traceRef.current = trace;
    trace.start();

    return () => {
      trace.stop();
    };
  }, [componentName, enabled]);

  return traceRef.current;
}

/**
 * Custom hook to measure page load performance
 * @param pageName - Name of the page to trace
 */
export function usePageLoadTrace(pageName: string) {
  useEffect(() => {
    const trace = createTrace(`page_${pageName}`);
    if (!trace) return;

    trace.start();

    const handleLoad = () => {
      trace.stop();
    };

    if (document.readyState === 'complete') {
      trace.stop();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      if (trace) {
        try {
          trace.stop();
        } catch (e) {
          // Trace might already be stopped
        }
      }
    };
  }, [pageName]);
}
