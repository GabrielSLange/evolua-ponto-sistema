export interface ModelFuncionario {
    id: string | undefined;
    nome: string;
    cpf: string;
    cargo: string;
    horarioTrabalho: string;
    ativo: boolean;
    estabelecimentoId: string;
}