import { ModelFuncionario } from "../ModelFuncionario";

export interface SolicitacaoPendenteDto {
    id: number;
    funcionario: ModelFuncionario; // O backend precisa mandar isso (Include)
    timestampMarcacao: string; // Data/Hora sugerida
    tipo: string; // ENTRADA, SAIDA, etc
    justificativaFuncionario?: string;
    registroManual: boolean;
}