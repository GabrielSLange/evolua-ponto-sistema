import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <ScrollViewStyleReset />

        {/* Injeta o CSS global (Fontes + Scrollbar) */}
        <style dangerouslySetInnerHTML={{ 
          __html: globalCss 
        }} />
        
        <title>Evolua Ponto</title>
      </head>
      <body>{children}</body>
    </html>
  );
}

// --- CSS COMBINADO (Fontes + Scrollbar) ---
const globalCss = `
/* 1. DEFINIÇÃO DA FONTE (O Pulo do Gato 🐈)
  Isso carrega a fonte direto da pasta /public/fonts/ sem passar pelo Bundler.
*/
@font-face {
  font-family: 'MaterialCommunityIcons';
  src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype');
}

/* 2. Fundo responsivo */
body {
  background-color: #fff;
  /* Garante que a fonte padrão esteja pronta caso falhe */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}

/* 3. Estilos da Barra de Rolagem (Seu código original mantido) */
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: #aaa;
}

@media (prefers-color-scheme: dark) {
  *::-webkit-scrollbar-thumb {
    background-color: #444;
  }
  *::-webkit-scrollbar-thumb:hover {
    background-color: #666;
  }
}
`;