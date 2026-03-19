using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EvoluaPonto.Api.Data;
using EvoluaPonto.Api.DTOs;

namespace EvoluaPonto.Api.Services
{
  public class EventosService
  {
    private readonly AppDbContext _context;

    public EventosService(AppDbContext context)
    {
      _context = context;
    }

    public async Task<List<EventoResponseDto>> ListarEventosDaEmpresaAsync(Guid empresaId)
    {
      return await _context.EventosProva
          .Where(e => e.EmpresaId == empresaId)
          .Select(e => new EventoResponseDto
          {
            Id = e.Id,
            NomeAplicacao = e.NomeAplicacao,
            PeriodoAplicacao = e.PeriodoAplicacao,
            TotalInscritos = e.Inscricoes.Count
          })
          .ToListAsync();
    }

    public async Task<List<AlunoResponseDto>> ListarAlunosDoEventoAsync(Guid eventoId, string? sala = null)
    {
      var query = _context.InscricoesAlunos
          .Include(i => i.Sala)
          .ThenInclude(s => s.Local)
          .Where(i => i.EventoProvaId == eventoId);

      if (!string.IsNullOrEmpty(sala))
      {
        query = query.Where(i => i.Sala.NomeSala.Contains(sala));
      }

      return await query
          .OrderBy(i => i.NomeAluno)
          .Select(i => new AlunoResponseDto
          {
            Id = i.Id,
            NomeAluno = i.NomeAluno,
            NumeroCarteira = i.NumeroCarteira,
            Curso = i.Curso,
            Modalidade = i.Modalidade,
            Sala = i.Sala.NomeSala,
            Local = i.Sala.Local.Campus,
            Bloco = i.Sala.Local.Bloco,
            Presente = i.Presente,
            DataHoraCheckin = i.DataHoraCheckin
          })
          .ToListAsync();
    }

    public async Task<object> RegistrarPresencaAsync(Guid inscricaoId)
    {
      var inscricao = await _context.InscricoesAlunos.FindAsync(inscricaoId);

      if (inscricao == null)
      {
        throw new KeyNotFoundException("Inscrição não encontrada.");
      }

      if (inscricao.Presente)
      {
        throw new InvalidOperationException("Presença já registrada para este aluno.");
      }

      inscricao.Presente = true;
      inscricao.DataHoraCheckin = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      return new
      {
        mensagem = "Presença registrada com sucesso.",
        horario = inscricao.DataHoraCheckin
      };
    }

    public async Task<object> ListarEventosDaEmpresaPaginadoAsync(Guid empresaId, int page, int pageSize, string search)
    {
      var query = _context.EventosProva.Where(e => e.EmpresaId == empresaId);

      if (!string.IsNullOrEmpty(search))
      {
        // Filtra pelo nome da aplicação ou pela string do período
        query = query.Where(e => e.NomeAplicacao.Contains(search) || e.PeriodoAplicacao.Contains(search));
      }

      var totalRecords = await query.CountAsync();
      var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

      var eventos = await query
          .OrderByDescending(e => e.PeriodoAplicacao) // Ordena para os mais recentes/alfabéticos
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .Select(e => new EventoResponseDto
          {
            Id = e.Id,
            NomeAplicacao = e.NomeAplicacao,
            PeriodoAplicacao = e.PeriodoAplicacao,
            TotalInscritos = e.Inscricoes.Count
          })
          .ToListAsync();

      return new
      {
        data = eventos,
        totalPages = totalPages,
        currentPage = page
      };
    }
  }
}