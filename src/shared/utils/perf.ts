import logger from '../../agent/services/logger.js';

export function withPerformance<T>(name: string, fn: () => Promise<T>): Promise<T>;
export function withPerformance<T>(name: string, fn: () => T): T;
export function withPerformance<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
        return result.then((val) => {
            const end = performance.now();
            logger.info(`[Perf] ${name} took ${(end - start).toFixed(2)}ms`);
            return val;
        });
    }

    const end = performance.now();
    logger.info(`[Perf] ${name} took ${(end - start).toFixed(2)}ms`);
    return result;
}
