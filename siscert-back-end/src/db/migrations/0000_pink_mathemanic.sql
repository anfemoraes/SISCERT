CREATE TYPE "public"."curso" AS ENUM('CFAT', 'CFATR', 'CAAT', 'CAATR');--> statement-breakpoint
CREATE TYPE "public"."resultado" AS ENUM('APROVADO', 'REPROVADO');--> statement-breakpoint
CREATE TABLE "certificacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(20),
	"curso" "curso" NOT NULL,
	"ano" integer NOT NULL,
	"numero" integer,
	"municipio" varchar(120) NOT NULL,
	"municipio_busca" varchar(120) NOT NULL,
	"periodo_inicio" date NOT NULL,
	"periodo_fim" date NOT NULL,
	"nome" varchar(200) NOT NULL,
	"nome_busca" varchar(200) NOT NULL,
	"cargo_funcao" varchar(120) NOT NULL,
	"cpf" varchar(11) NOT NULL,
	"frequencia" numeric(5, 2) NOT NULL,
	"nota_ad" numeric(5, 2),
	"nota_od" numeric(5, 2),
	"nota_af" numeric(5, 2),
	"media_final" numeric(5, 2),
	"resultado" "resultado" NOT NULL,
	"observacoes" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificacoes_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "uq_concluinte_curso" UNIQUE("cpf","curso","periodo_inicio","periodo_fim")
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"curso" "curso" NOT NULL,
	"ano" integer NOT NULL,
	"ultimo" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "sequencias_curso_ano_pk" PRIMARY KEY("curso","ano")
);
--> statement-breakpoint
CREATE INDEX "idx_certificacoes_cpf" ON "certificacoes" USING btree ("cpf");--> statement-breakpoint
CREATE INDEX "idx_certificacoes_nome_busca" ON "certificacoes" USING btree ("nome_busca");--> statement-breakpoint
CREATE INDEX "idx_certificacoes_municipio_busca" ON "certificacoes" USING btree ("municipio_busca");