export interface ModelEstabelecimento {
   id: string | undefined;
   nomeFantasia: string;
   logradouro: string;
   numero: string;
   bairro: string;
   cidade: string;
   cep: string;
   complemento: string;
   estado: string;
   ativo: boolean;
   empresaId: string;
   latitude: number;
   longitude: number;
}