const listeners = new Map();

export const Events = {
  DATA_LOADED: 'data:loaded',
  FILTER_CHANGED: 'filter:changed',
  TIMEFRAME_CHANGED: 'timeframe:changed',
  INDICATOR_SELECTED: 'indicator:selected',
  CHART_HIGHLIGHT: 'chart:highlight',
  EXPORT_REQUESTED: 'export:requested'
};

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event).delete(callback);
}

export function emit(event, payload) {
  if (listeners.has(event)) {
    listeners.get(event).forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`[EventBus] ${event}:`, e); }
    });
  }
}

export function off(event, callback) {
  if (listeners.has(event)) {
    listeners.get(event).delete(callback);
  }
}
