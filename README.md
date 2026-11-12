# SISCERT — Sistema de Certificação de Agentes de Trânsito

Integração do frontend React/Vite com a API Fastify/TypeScript e PostgreSQL.

## O que está implementado

- Login administrativo por e-mail e senha, com senha armazenada em hash scrypt.
- Sessão assinada pelo servidor em cookie `HttpOnly`, `SameSite=Lax`, com validade de 8 horas.
- Rotas administrativas protegidas: resumo, pesquisa de certificações e cadastro de atas.
- Consulta pública de autenticidade por código, sem login.
- Dashboard com contadores reais do banco.
- Cadastro de atas com 1 a 50 concluintes, validação de CPF no servidor e geração sequencial dos códigos para aprovados. CPF é obrigatório; os demais dados do concluinte podem ficar vazios. Campos de texto vazios são registrados como `XXXXXX`, e campos numéricos/resultado permanecem vazios.
- Pesquisa de certificações por nome, CPF, município e curso; exportação dos resultados exibidos para CSV.
- Layout responsivo preservando a identidade visual do protótipo original.
- Docker Compose com PostgreSQL persistente, backend, frontend e migrações automáticas.

## Executar com Docker (recomendado)

1. Na raiz do projeto, crie o arquivo de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Gere o hash da senha administrativa (use uma senha forte, com pelo menos 12 caracteres):

   ```bash
   cd siscert-back-end
   npm ci
   npm run admin:hash -- "SuaSenhaForteCom12Caracteres!"
   ```

   Copie o hash exibido para `ADMIN_PASSWORD_HASH` no `.env`. Não coloque a senha em arquivos versionados.

3. Gere um segredo de sessão:

   ```bash
   openssl rand -base64 48
   ```

   Copie o resultado para `SESSION_SECRET` no `.env`. Volte à raiz do projeto.

4. Edite `POSTGRES_PASSWORD` no `.env` e inicie:

   ```bash
   docker compose up -d --build
   ```

5. Acesse:
   - Frontend: http://localhost:8080
   - API: http://localhost:3000/health
   - Documentação da API: http://localhost:3000/docs

O primeiro acesso usa o `ADMIN_EMAIL` e a senha correspondente ao hash configurado. O banco é persistido no volume Docker `siscert_db`.

## Executar sem Docker

### Backend

```bash
cd siscert-back-end
cp .env.example .env
npm ci
npm run admin:hash -- "SuaSenhaForteCom12Caracteres!"
# Preencha DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET e CORS_ORIGINS.
npm run db:migrate
npm run dev
```

### Frontend (outro terminal)

```bash
cd siscert-front-end
npm ci
# Opcional: crie .env.local com VITE_API_URL=http://localhost:3000
npm run dev
```

## Segurança e publicação

- Nunca envie `.env`, senhas, hashes ou segredos ao Git.
- Em produção, use HTTPS e configure `COOKIE_SECURE=true`.
- Ajuste `CORS_ORIGINS` para a origem exata do frontend publicado.
- Configure backup do volume PostgreSQL e política institucional de criação/rotação de credenciais.
- A validação pública consulta somente pelo código; a pesquisa administrativa e o cadastro exigem sessão.

## Limitações funcionais a validar com o CETRAN/PA

O backend fornecido não contém cadastro independente de usuários, catálogo de cursos homologados, gestão de órgãos municipais, fluxo de aprovação documental ou relatórios oficiais em PDF. Nesta integração, cursos e municípios são filtros/dados associados às certificações; a exportação disponível é CSV. Esses módulos dependem de regras e dados oficiais que precisam ser definidos antes de implementá-los sem inventar informações.
