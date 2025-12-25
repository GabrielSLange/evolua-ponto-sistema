import { ModelFuncionario } from "../ModelFuncionario";

export interface SolicitacaoPontoDto {
    id: number;
    funcionario: ModelFuncionario; // O backend precisa mandar isso (Include)
    timestampMarcacao: string; // Data/Hora sugerida
    tipo: string; // ENTRADA, SAIDA, etc
    status: number;
    justificativaFuncionario?: string;
    justificativaAdmin?: string;
    registroManual: boolean;
}