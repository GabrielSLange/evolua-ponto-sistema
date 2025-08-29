import { Redirect } from 'expo-router';

// Esta tela não renderiza nada. Ela apenas redireciona o usuário
// para a rota inicial correta com base no seu estado de login.
// A lógica principal de "proteção de rotas" estará no _layout.tsx.
const StartPage = () => {
   return <Redirect href="/(employee)/home" />;
};

export default StartPage;