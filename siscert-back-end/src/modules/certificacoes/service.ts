import { mascararCpf } from '../../shared/cpf.js';
import { normalizarTexto } from '../../shared/texto.js';
import * as repo from './repository.js';
import type { CertificacaoDto, AtaInput } from './schemas.js';

export class ConflitoError extends Error {}

export function formatarCodigo(curso: string, ano: number, numero: number): string {
  return `${curso}${ano}.${String(numero).padStart(4, '0')}`;
}

const dec = (n: number | undefined) => (n === undefined ? null : n.toFixed(2));

function codigoErroPg(err: unknown): string | undefined {
  let atual: any = err;
  for (let i = 0; i < 4 && atual; i++) {
    if (typeof atual.code === 'string') return atual.code;
    atual = atual.cause;
  }
  return undefined;
}

export function paraDto(l: repo.LinhaCertificacao): CertificacaoDto {
  const num = (v: string | null) => (v === null ? null : Number(v));
  return {
    codigo: l.codigo,
    curso: l.curso,
    municipio: l.municipio,
    periodoInicio: l.periodoInicio,
    periodoFim: l.periodoFim,
    nome: l.nome,
    cargoFuncao: l.cargoFuncao,
    cpf: mascararCpf(l.cpf),
    frequencia: Number(l.frequencia),
    notaAd: num(l.notaAd),
    notaOd: num(l.notaOd),
    notaAf: num(l.notaAf),
    mediaFinal: num(l.mediaFinal),
    resultado: l.resultado,
    observacoes: l.observacoes,
  };
}

/**
 * Cadastra uma ata inteira numa única transação: ou entram todos, ou nenhum.
 * Só APROVADO recebe código. O ano do código é o do fim do período do curso.
 */
export async function cadastrarAta(db: repo.Db, ata: AtaInput): Promise<CertificacaoDto[]> {
  const ano = Number(ata.periodoFim.slice(0, 4));

  try {
    const criados = await db.transaction(async (tx) => {
      const linhas: repo.LinhaCertificacao[] = [];
      for (const c of ata.concluintes) {
        const numero =
          c.resultado === 'APROVADO' ? await repo.proximoNumero(tx, ata.curso, ano) : null;

        linhas.push(
          await repo.inserir(tx, {
            codigo: numero === null ? null : formatarCodigo(ata.curso, ano, numero),
            curso: ata.curso,
            ano,
            numero,
            municipio: ata.municipio,
            municipioBusca: normalizarTexto(ata.municipio),
            periodoInicio: ata.periodoInicio,
            periodoFim: ata.periodoFim,
            nome: c.nome,
            nomeBusca: normalizarTexto(c.nome),
            cargoFuncao: c.cargoFuncao,
            cpf: c.cpf,
            frequencia: c.frequencia.toFixed(2),
            notaAd: dec(c.notaAd),
            notaOd: dec(c.notaOd),
            notaAf: dec(c.notaAf),
            mediaFinal: dec(c.mediaFinal),
            resultado: c.resultado,
            observacoes: c.observacoes ?? null,
          }),
        );
      }
      return linhas;
    });
    return criados.map(paraDto);
  } catch (err) {
    if (codigoErroPg(err) === '23505') {
      throw new ConflitoError(
        'Algum CPF já está cadastrado neste curso e período. Nenhum registro da ata foi gravado.',
      );
    }
    throw err;
  }
}

export async function pesquisar(db: repo.Db, filtros: repo.FiltrosBusca) {
  const { total, itens } = await repo.buscar(db, filtros);
  return { total, pagina: filtros.pagina, tamanho: filtros.tamanho, itens: itens.map(paraDto) };
}

export async function verificar(db: repo.Db, codigo: string): Promise<CertificacaoDto | null> {
  const linha = await repo.porCodigo(db, codigo);
  return linha ? paraDto(linha) : null;
}
