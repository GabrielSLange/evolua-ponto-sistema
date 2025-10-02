export interface ModelFuncionario {
    id: string | undefined;
    nome: string;
    cpf: string;
    email: string;
    password?: string;
    cargo: string;
    estabelecimentoId: string;
    role: string;
    horarioContratual?: string;
    ativo: boolean;
    createdAt?: Date;
}