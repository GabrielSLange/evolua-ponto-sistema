using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.Models;
using EvoluaPonto.Api.Models.Shared;
using Microsoft.EntityFrameworkCore;

namespace EvoluaPonto.Api.Services
{
    public class EstabelecimentoService
    {
        private readonly AppDbContext _context;

        public EstabelecimentoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<List<ModelEstabelecimento>>> GetEstabelecimentosEmpresa(Guid EmpresaId) 
            => new ServiceResponse<List<ModelEstabelecimento>> { Data = await _context.Estabelecimentos.AsNoTracking().Where(tb => tb.EmpresaId == EmpresaId).ToListAsync() };

        public async Task<ServiceResponse<ModelEstabelecimento>> GetEstabelecimentoById(Guid EstabelecimentoId)
        {
            ModelEstabelecimento? estabelecimentoBanco = await _context.Estabelecimentos.FirstOrDefaultAsync(tb => tb.Id == EstabelecimentoId);

            if(estabelecimentoBanco is null)
                return new ServiceResponse<ModelEstabelecimento> { Success = false, ErrorMessage = "Nenhum estabelecimento encontrado com o ID informado"};

            return new ServiceResponse<ModelEstabelecimento> { Data = estabelecimentoBanco };
        }

        public async Task<ServiceResponse<ModelEstabelecimento>> CreateEsabelecimento(ModelEstabelecimento novoEstabelecimento)
        {
            if (!await _context.Empresas.AnyAsync(tb => tb.Id == novoEstabelecimento.EmpresaId))
                return new ServiceResponse<ModelEstabelecimento> { Success = false, ErrorMessage = "Nenhuma empresa encontrada vinculada ao estabelecimento" };

            await _context.Estabelecimentos.AddAsync(novoEstabelecimento);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelEstabelecimento> { Data = novoEstabelecimento };
        }

        public async Task<ServiceResponse<ModelEstabelecimento>> UpdateEstabelecimento(ModelEstabelecimento estabelecimentoAtualizado)
        {
            if (!await _context.Empresas.AnyAsync(tb => tb.Id == estabelecimentoAtualizado.EmpresaId))
                return new ServiceResponse<ModelEstabelecimento> { Success = false, ErrorMessage = "Nenhuma empresa encontrada vinculada ao estabelecimento" };

            ModelEstabelecimento? estabelecimentoBanco = await _context.Estabelecimentos.FirstOrDefaultAsync(tb => tb.Id == estabelecimentoAtualizado.Id);

            if (estabelecimentoBanco is null)
                return new ServiceResponse<ModelEstabelecimento> { Success = false, ErrorMessage = "Não foi encontrado nenhum estabelecimento com o ID informado" };

            estabelecimentoBanco.NomeFantasia = estabelecimentoAtualizado.NomeFantasia;
            estabelecimentoBanco.Logradouro = estabelecimentoAtualizado.Logradouro;
            estabelecimentoBanco.Complemento = estabelecimentoAtualizado.Complemento;
            estabelecimentoBanco.Bairro = estabelecimentoAtualizado.Bairro;
            estabelecimentoBanco.Cidade = estabelecimentoAtualizado.Cidade;
            estabelecimentoBanco.Estado = estabelecimentoAtualizado.Estado;
            estabelecimentoBanco.Cep = estabelecimentoAtualizado.Cep;

            _context.Update(estabelecimentoBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<ModelEstabelecimento> { Data = estabelecimentoBanco };
        }

        public async Task<ServiceResponse<bool>> ToggleAtivoAsync(Guid estabelecimentoId)
        {
            ModelEstabelecimento? estabelecimentoBanco = await _context.Estabelecimentos.FirstOrDefaultAsync(tb => tb.Id == estabelecimentoId);

            if (estabelecimentoBanco == null)
                return new ServiceResponse<bool> { Success = false, ErrorMessage = "Não foi encontrado nenhum estabalecimento com esse ID" };

            estabelecimentoBanco.Ativo = !estabelecimentoBanco.Ativo;
            _context.Update(estabelecimentoBanco);
            await _context.SaveChangesAsync();

            return new ServiceResponse<bool> { Data = true };
        }
    }
}
