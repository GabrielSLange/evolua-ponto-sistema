// utils/ignoreWarnings.ts

if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;

  const ignoreWarns = [
    'shadow* style props are deprecated',
    'Animated: `useNativeDriver` is not supported',
    'Route "relatorios" is extraneous',
    'is not supported because the native animated module is missing',
    'props.pointerEvents is deprecated',
  ];

  // Remover crases e ser mais genérico
  const ignoreErrors = [
    'Invalid prop', // Filtro parcial
    'Too many screens defined',
  ];

  console.warn = (...args) => {
    const log = args.join(' ');
    if (ignoreWarns.some((msg) => log.includes(msg))) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const log = args.join(' ');
    
    // Regra específica para o erro do Fragment que é teimoso
    if (log.includes('Invalid prop') && log.includes('compact')) {
      return;
    }

    if (ignoreErrors.some((msg) => log.includes(msg))) {
      return;
    }
    originalError.apply(console, args);
  };
}