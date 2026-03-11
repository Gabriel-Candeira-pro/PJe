# Pje

Repositório monorepo com serviços Node.js para o projeto Pje.

## Visão geral

Este repositório contém vários serviços que compõem a aplicação:

- `api-gateway` – gateway HTTP/rota de APIs
- `auth-service` – serviço de autenticação
- `operator-ui` – interface web estática
- `worker` – processamento em background
- `infra` – orquestração (ex.: `docker-compose.yml`)
- `shared` – utilitários e documentação compartilhada
- `scripts` – scripts auxiliares (ex.: `startAll.js`)

## Estrutura do repositório

```
package.json
main/
  package.json
  README.md
  api-gateway/
  auth-service/
  infra/
  operator-ui/
  scripts/
  shared/
  worker/
```

## Requisitos

- Node.js (recomendado v16+)
- npm ou yarn
- Docker & Docker Compose (para execução via containers)

## Instalação (desenvolvimento)

No root do repositório:

```bash
npm install
# ou
# yarn install
```

Em seguida, para rodar todos os serviços em modo de desenvolvimento (quando disponível):

```bash
npm run start:all
```

> Observação: `scripts/startAll.js` coordena o start local dos serviços dentro deste monorepo.

## Execução com Docker Compose

Para subir a aplicação via Docker Compose (usa `infra/docker-compose.yml`):

```bash
docker compose -f infra/docker-compose.yml up --build -d
```

Para parar e remover containers:

```bash
docker compose -f infra/docker-compose.yml down
```

## Scripts úteis

- `npm run start:all` — inicia todos os serviços (ver `scripts/startAll.js`).
- Cada serviço possui seu próprio `package.json` em sua pasta.

## Contribuição

Abra issues para sugerir melhorias ou correções. Para pull requests, descreva o propósito e como testar localmente.
