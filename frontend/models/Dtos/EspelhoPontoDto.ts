export interface MarcacaoDto {
    id: string;
    hora: string;
    tipo: string; // 'ENTRADA' | 'SAIDA'
    isManual: boolean;
    statusSolicitacao: string;
}

export interface DiaEspelhoDto {
    data: string;
    diaSemana: string;
    isFimDeSemana: boolean;
    isFeriado: boolean;
    isHoje: boolean;
    status: string; // 'Completo', 'Incompleto', 'Falta', 'Folga', 'Futuro'
    marcacoes: MarcacaoDto[];
}

export interface EspelhoPontoDto {
    mesReferencia: string;
    saldoPrevisto: string;
    dias: DiaEspelhoDto[];
}