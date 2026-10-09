/**
 * Data-heavy surfaces may step outside the readable prose measure while
 * staying inside the thread viewport. The viewport is an inline-size
 * container (message-scroller.tsx), so this remains correct beside either
 * sidebar width and never reaches under app chrome.
 */
export const THREAD_ANALYSIS_WIDTH =
  "relative left-1/2 w-[min(68rem,calc(100cqw-1.5rem))] max-w-none -translate-x-1/2 sm:w-[min(68rem,calc(100cqw-3rem))]";
