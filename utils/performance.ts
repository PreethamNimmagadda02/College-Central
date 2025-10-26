import { perf } from '../firebaseConfig';

/**
 * Custom trace for monitoring specific operations
 * @param traceName - Name of the trace
 * @param callback - Function to execute and measure
 * @returns Promise with the callback result
 */
export async function tracePerformance<T>(
  traceName: string,
  callback: () => Promise<T> | T
): Promise<T> {
  if (!perf) {
    // If performance monitoring is not enabled, just run the callback
    return await callback();
  }

  const trace = perf.trace(traceName);
  trace.start();

  try {
    const result = await callback();
    trace.stop();
    return result;
  } catch (error) {
    trace.stop();
    throw error;
  }
}

/**
 * Create a custom trace for manual control
 * @param traceName - Name of the trace
 * @returns Trace object with start/stop methods, or null if not available
 */
export function createTrace(traceName: string) {
  if (!perf) {
    return null;
  }
  return perf.trace(traceName);
}

/**
 * Log custom metric to performance monitoring
 * @param metricName - Name of the metric
 * @param value - Value of the metric
 */
export function logMetric(traceName: string, metricName: string, value: number) {
  if (!perf) {
    return;
  }

  const trace = perf.trace(traceName);
  trace.start();
  trace.putMetric(metricName, value);
  trace.stop();
}

/**
 * Measure page load performance
 */
export function measurePageLoad(pageName: string) {
  if (!perf) {
    return;
  }

  const trace = perf.trace(`page_load_${pageName}`);
  trace.start();

  // Stop the trace when the page is fully loaded
  if (document.readyState === 'complete') {
    trace.stop();
  } else {
    window.addEventListener('load', () => {
      trace.stop();
    });
  }
}

/**
 * Measure component render time
 * @param componentName - Name of the component
 * @returns Object with start and stop functions
 */
export function measureComponentRender(componentName: string) {
  if (!perf) {
    return {
      start: () => {},
      stop: () => {},
    };
  }

  const trace = perf.trace(`component_render_${componentName}`);

  return {
    start: () => trace.start(),
    stop: () => trace.stop(),
  };
}

/**
 * Measure network request performance
 * @param requestName - Name of the request
 * @param httpMethod - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 */
export async function measureNetworkRequest<T>(
  requestName: string,
  httpMethod: string,
  url: string,
  callback: () => Promise<T>
): Promise<T> {
  if (!perf) {
    return await callback();
  }

  const trace = perf.trace(`network_${requestName}`);
  trace.putAttribute('http_method', httpMethod);
  trace.putAttribute('url', url);
  trace.start();

  try {
    const result = await callback();
    trace.putMetric('success', 1);
    trace.stop();
    return result;
  } catch (error) {
    trace.putMetric('success', 0);
    trace.stop();
    throw error;
  }
}
