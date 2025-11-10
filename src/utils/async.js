/**
 * Runs an async function periodically with a cancelable handle.
 * @param {Function} task - Possibly async function to run
 * @param {number} intervalMs - Delay between task completions
 * @returns {{ cancel: () => void }} - Object with cancel method
 */
export function setIntervalAsync(task, intervalMs) {
  let cancelled = false;
  let timeoutId = null;

  const run = async () => {
    if (cancelled) return;

    // We propagate errors from task to avoid silent failures
    await task();

    // During the task execution, it might have been cancelled
    if (!cancelled) {
        timeoutId = setTimeout(run, intervalMs);
    }
  };
  // Initial call
  task();
  // Start immediately
  timeoutId = setTimeout(run, intervalMs);

  // Return cancel handle
  return (() => {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
  });
}
