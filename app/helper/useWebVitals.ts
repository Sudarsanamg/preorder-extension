import { useEffect } from 'react';
import { onCLS, onLCP, onINP, onTTFB } from 'web-vitals';

export const useWebVitals = ({ path }: { path: string }) => {
  useEffect(() => {
    let ttfb: number = 0;
    onTTFB((metric: any) => {
      ttfb = metric.value;
    });

    onLCP(
      (metric) => {
        const loadTime: number = metric.entries[0].loadTime;
        const startTime: number = metric.entries[0].startTime;
        const renderTime: number = metric.entries[0].renderTime;

        const resourceLoadDelay = startTime - ttfb;
        const resourceLoadTime = loadTime - startTime;
        const elementRenderDelay = renderTime - loadTime;

        console.log(
          `Web Vitals (${path}) - LCP: ${(metric.value * 10).toFixed(2)} (${metric.rating})`
        );
        console.log(`TTFB: ${ttfb}`);
        console.log(`Resource Load Delay: ${resourceLoadDelay}`);
        console.log(`Resource Load Time: ${resourceLoadTime}`);
        console.log(`Element Render Delay: ${elementRenderDelay}`);
      },
      { reportAllChanges: true }
    );

    onLCP(
      (metric: any) => {
        console.log(
          `Web Vitals (${path}) - LCP: ${(metric.value * 10).toFixed(2)} (${metric.rating})`,
          metric.entries
        );
      },
      { reportAllChanges: true }
    );

    onCLS(
      (metric: any) => {
        console.log(
          `Web Vitals (${path}) - CLS: ${(metric.value * 10).toFixed(2)} (${metric.rating})`,
          metric.entries
        );
      },
      { reportAllChanges: true }
    );

    onINP(
      (metric: any) => {
        console.log(
          `Web Vitals (${path}) - INP: ${(metric.value * 10).toFixed(2)} (${metric.rating})`
        );
      },
      { reportAllChanges: true }
    );
  }, [path]);

  return null;
};