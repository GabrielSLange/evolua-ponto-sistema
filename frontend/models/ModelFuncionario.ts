import { ModelEstabelecimento } from './ModelEstabelecimento';
export interface ModelFuncionario {
    id: string | null;
    nome: string;
    cpf: string;
    email: string;
    password?: string;
    cargo: string;
    role: string;
    estabelecimentoId: string;
    estabelecimento?: ModelEstabelecimento;
    horarioContratual?: string;
    ativo: boolean;
}