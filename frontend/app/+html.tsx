import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ 
          __html: globalCss 
        }} />
        
        <title>Evolua Ponto</title>
      </head>
      <body>{children}</body>
    </html>
  );
}

// --- CSS COMBINADO (Versão Final e Simplificada) ---
const globalCss = `
/* Fundo responsivo (seu código original) */
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}

/* * --- Estilos da Barra de Rolagem (WebKit: Chrome, Edge, Safari) ---
 * Aplica-se a todos os elementos com scroll (*)
 */

/* 1. Largura da barra */
*::-webkit-scrollbar {
  width: 8px;  /* Deixa a barra mais fina */
  height: 8px; /* Para barras horizontais */
}

/* 2. A "trilha" (fundo) - Deixamos transparente */
*::-webkit-scrollbar-track {
  background: transparent;
}

/* 3. O "polegar" (a parte que arrasta) - TEMA CLARO */
*::-webkit-scrollbar-thumb {
  background-color: #ccc; /* Um cinza claro sutil */
  border-radius: 4px;     /* Bordas arredondadas */
}

*::-webkit-scrollbar-thumb:hover {
  background-color: #aaa; /* Um pouco mais escuro ao passar o mouse */
}

/* 4. Cores para o TEMA ESCURO */
@media (prefers-color-scheme: dark) {
  *::-webkit-scrollbar-thumb {
    background-color: #444; /* Um cinza escuro sutil */
  }
  *::-webkit-scrollbar-thumb:hover {
    background-color: #666; /* Um pouco mais claro ao passar o mouse */
  }
}
`;