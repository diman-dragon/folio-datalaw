// Holds the active format handle ({ goTo, zoomBy, ensureText, ... }) for UI modules that need it.
let handle = null;
export const setActiveHandle = (h) => { handle = h; };
export const getActiveHandle = () => handle;
