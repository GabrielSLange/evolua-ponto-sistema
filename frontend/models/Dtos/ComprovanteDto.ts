export interface ComprovanteDto {
  id: number;
  timestampMarcacao: string; // O backend envia datas como strings ISO
  tipo: string;
  comprovanteUrl: string;
}