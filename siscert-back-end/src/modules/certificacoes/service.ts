import { mascararCpf } from '../../shared/cpf.js';
import { normalizarTexto } from '../../shared/texto.js';
import * as repo from './repository.js';
import {
  CURSOS_COM_NOTA,
  type CertificacaoDto,
  type AtaInput,
  type AtualizarCertificacaoInput,
} from './schemas.js';

export class ConflitoError extends Error {}
export class DadosInvalidosError extends Error {}

export function formatarCodigo(curso: string, ano: number, numero: number): string {
  return `${curso}${ano}.${String(numero).padStart(4, '0')}`;
}

const dec = (n: number | null | undefined) => (n === undefined || n === null ? null : n.toFixed(2));

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
    id: l.id,
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

export async function obterPorId(db: repo.Db, id: number): Promise<CertificacaoDto | null> {
  const linha = await repo.porId(db, id);
  return linha ? paraDto(linha) : null;
}

export async function atualizarCertificado(
  db: repo.Db,
  id: number,
  dados: AtualizarCertificacaoInput,
): Promise<CertificacaoDto | null> {
  const existente = await repo.porId(db, id);
  if (!existente) return null;

  const cursoFinal = (dados.curso ?? existente.curso) as repo.Curso;
  const periodoInicioFinal = dados.periodoInicio ?? existente.periodoInicio;
  const periodoFimFinal = dados.periodoFim ?? existente.periodoFim;
  const anoFinal = Number(periodoFimFinal.slice(0, 4));
  const resultadoFinal = dados.resultado ?? existente.resultado;

  if (periodoFimFinal < periodoInicioFinal) {
    throw new DadosInvalidosError('Data de término não pode ser anterior à data de início.');
  }

  if (CURSOS_COM_NOTA.includes(cursoFinal)) {
    const notaAd = dados.notaAd !== undefined ? dados.notaAd : existente.notaAd !== null ? Number(existente.notaAd) : undefined;
    const notaOd = dados.notaOd !== undefined ? dados.notaOd : existente.notaOd !== null ? Number(existente.notaOd) : undefined;
    const notaAf = dados.notaAf !== undefined ? dados.notaAf : existente.notaAf !== null ? Number(existente.notaAf) : undefined;
    const mediaFinal = dados.mediaFinal !== undefined ? dados.mediaFinal : existente.mediaFinal !== null ? Number(existente.mediaFinal) : undefined;

    if (
      notaAd === undefined || notaAd === null ||
      notaOd === undefined || notaOd === null ||
      notaAf === undefined || notaAf === null ||
      mediaFinal === undefined || mediaFinal === null
    ) {
      throw new DadosInvalidosError('Cursos de formação (CFAT e CFATR) exigem as notas AD, OD, AF e Média Final.');
    }
  }

  try {
    return await db.transaction(async (tx) => {
      let codigo = existente.codigo;
      let numero = existente.numero;
      let ano = existente.ano;

      if (resultadoFinal === 'REPROVADO') {
        codigo = null;
        numero = null;
      } else {
        // APROVADO
        const cursoMudou = dados.curso && dados.curso !== existente.curso;
        const anoMudou = anoFinal !== existente.ano;
        if (!codigo || cursoMudou || anoMudou) {
          numero = await repo.proximoNumero(tx, cursoFinal, anoFinal);
          ano = anoFinal;
          codigo = formatarCodigo(cursoFinal, anoFinal, numero);
        }
      }

      const atualizado = await repo.atualizar(tx, id, {
        ...(dados.nome ? { nome: dados.nome, nomeBusca: normalizarTexto(dados.nome) } : {}),
        ...(dados.cargoFuncao ? { cargoFuncao: dados.cargoFuncao } : {}),
        ...(dados.cpf ? { cpf: dados.cpf } : {}),
        ...(dados.municipio ? { municipio: dados.municipio, municipioBusca: normalizarTexto(dados.municipio) } : {}),
        ...(dados.curso ? { curso: cursoFinal } : {}),
        ...(dados.periodoInicio ? { periodoInicio: dados.periodoInicio } : {}),
        ...(dados.periodoFim ? { periodoFim: dados.periodoFim, ano: anoFinal } : {}),
        ...(dados.frequencia !== undefined ? { frequencia: dados.frequencia.toFixed(2) } : {}),
        ...(dados.notaAd !== undefined ? { notaAd: dec(dados.notaAd) } : {}),
        ...(dados.notaOd !== undefined ? { notaOd: dec(dados.notaOd) } : {}),
        ...(dados.notaAf !== undefined ? { notaAf: dec(dados.notaAf) } : {}),
        ...(dados.mediaFinal !== undefined ? { mediaFinal: dec(dados.mediaFinal) } : {}),
        ...(dados.resultado ? { resultado: resultadoFinal } : {}),
        ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {}),
        codigo,
        numero,
      });

      return atualizado ? paraDto(atualizado) : null;
    });
  } catch (err) {
    if (codigoErroPg(err) === '23505') {
      throw new ConflitoError('Já existe uma certificação cadastrada para este CPF neste curso e período.');
    }
    throw err;
  }
}

export async function excluirCertificado(db: repo.Db, id: number): Promise<boolean> {
  return repo.excluir(db, id);
}
