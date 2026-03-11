# PoC Extração PJe — Passphrase sob demanda

## Visão geral

Projeto PoC para extração de dados do PJe onde o servidor solicita a `passphrase` do arquivo PKCS#12 apenas quando necessário (intervenção humana). O `passphrase` é enviado via canal seguro, usado apenas em memória para carregar o certificado e imediatamente limpo.

## Arquitetura (resumo)

- Worker de scraping (Playwright ou HTTP client) tenta autenticar e extrair.
- Quando é necessária intervenção (PIN/passphrase), cria-se uma intervenção no servidor.
- Operador insere a `passphrase` via UI segura; servidor carrega PKCS#12 em memória, obtém a sessão e prossegue.
- Auditoria registra quem e quando, sem persistir a `passphrase`.

## Fluxo de intervenção

1. Worker cria intervenção: `POST /interventions` → retorna `id` e `expires_at`.
2. Notificação ao operador (webhook, e-mail ou Slack) com link seguro.
3. Operador abre painel seguro e envia `passphrase`: `POST /interventions/:id/passphrase`.
4. Servidor carrega o PKCS#12 em memória, estabelece sessão com o PJe, e o worker retoma a extração.
5. `passphrase` é zerada da memória e a intervenção é fechada. Logs e auditoria são gravados (sem o segredo).

## Endpoints (PoC sugerido)

- `POST /interventions` — cria nova intervenção. Payload mínimo: `{ "worker_id": "...", "reason": "..." }`.
- `GET /interventions/:id` — obter estado (pending/used/expired/error).
- `POST /interventions/:id/passphrase` — enviar passphrase. Payload: `{ "passphrase": "S3nh@-Ex" }`.

> Regras importantes: todos os endpoints devem usar HTTPS, autenticação forte (JWT + SSO/MFA) e atender CORS/CSP restritos.

## Segurança

- `passphrase` NUNCA deve ser logada ou persistida em texto.
- Usar TLS 1.2/1.3 e políticas HSTS.
- Tokens de intervenção têm curta validade (ex.: 5 minutos) e uso único.
- Armazenar metadados da intervenção (operador, timestamp, IP) para auditoria.
- Preferir HashiCorp Vault ou KMS para armazenar PKCS#12 se possível; ainda assim, exigir intervenção para passphrase quando necessário.

## Como executar (PoC Node/Express)

Requisitos: `node >= 16`, `npm`.

Instalação e execução (exemplo):

```bash
npm install
npm run start
```

Exemplo rápido de uso (simulado):

1) Criar intervenção (worker):

```bash
curl -X POST https://localhost:3000/interventions -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"worker_id":"worker-1","reason":"login-certificate"}'
```

Resposta esperada:

```json
{ "id": "uuid-1234", "expires_at": "2026-03-11T12:34:56Z" }
```

2) Operador submete passphrase:

```bash
curl -X POST https://localhost:3000/interventions/uuid-1234/passphrase -H "Authorization: Bearer <op-token>" -H "Content-Type: application/json" -d '{"passphrase":"S3nh@-Ex"}'
```

Resposta: `200 OK` se for aceita; o worker retoma automaticamente.

## Testes e verificação

- Implementar testes unitários para o fluxo da API e mocks para o carregamento do PKCS#12.
- Testar expiração de intervenção e comportamento de retry do worker.

## Próximos passos sugeridos

- Gerar esqueleto do backend (Node/Express) + rotas acima e um stub do worker que cria intervenções.
- Implementar UI simples para operadores com autenticação SSO/MFA.
- Integrar com Vault/KMS para armazenamento de artefatos e segredos de forma segura.
- Implementar Playwright script que reutiliza cookie/session obtida após intervenção.

---

Arquivo gerado como PoC para orientar a implementação da Opção B (passphrase sob demanda).