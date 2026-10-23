// Node 22+ define un localStorage global que queda vacío sin --localstorage-file y tapa el de jsdom.
// En las pruebas se usa un Storage en memoria cuando el global no sirve.
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const datos = new Map<string, string>();
  const memoria: Storage = {
    get length() { return datos.size; },
    clear: () => datos.clear(),
    getItem: (clave) => datos.get(clave) ?? null,
    key: (i) => [...datos.keys()][i] ?? null,
    removeItem: (clave) => { datos.delete(clave); },
    setItem: (clave, valor) => { datos.set(clave, String(valor)); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoria, configurable: true, writable: true });
}
