namespace EvoluaPonto.Api.Dtos
{
    public class RelatorioLoteRequest
    {
        public List<Guid> FuncionariosIds { get; set; }
        public int Ano { get; set; }
        public int MesInicio { get; set; } // Renomeie Mes para MesInicio para ficar claro
        public int MesFim { get; set; }    // Adicione esta propriedade
    }
}
