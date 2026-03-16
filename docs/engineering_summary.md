# Engineering Summary — Editora Globo Férias

---

## 1. Maturidade atual

- **Funcionalidade:** fluxo de férias CLT com aprovação multi-nível, saldo por ciclo e histórico detalhado.
- **Arquitetura:** páginas finas com services e repositories; regras de negócio centralizadas.
- **Qualidade:** boa cobertura de testes unitários; alguns cenários de CLT ainda sensíveis a datas de fronteira.
- **Segurança:** sessão com cookie HTTP-only/HMAC e rate limit básico; hash de senha ainda em SHA-256.

---

## 2. Melhorias implementadas nesta fase

- Bloqueio de edição de férias pelo colaborador — apenas gestão (coordenadores/gestores, gerentes e RH) pode alterar períodos de solicitações alheias.
- Confirmação explícita ao cancelar/excluir solicitações, com mensagens de sucesso específicas.
- Destaque de **Justificativa (opcional)** no formulário de nova solicitação.
- Seção **Próximas férias** na view do colaborador, melhorando visibilidade do planejamento.
- Logging estruturado para login, aprovação, reprovação e export.
- Rate limit aplicado em login e criação de solicitações.
- Unificação da listagem/export em `vacationRequestListService`, reduzindo divergências de visibilidade.

---

## 3. Dívida técnica remanescente (top 5)

1. Migrar hash de senha para bcrypt/argon2 com migração segura.
2. Substituir rate limit em memória por backend distribuído (Redis) se houver múltiplas instâncias.
3. Criar testes de integração para fluxos completos de API.
4. Modularizar `vacationRules.ts` para facilitar evolução.
5. Refinar testes de validação CLT para serem robustos a timezone/datas móveis.

---

## 4. Próximas grandes features recomendadas

1. **Calendário visual consolidado** para colaborador e gestão.
2. **Notificações por e-mail/Slack** em eventos-chave (criação, aprovação, reprovação, início de férias).
3. **Relatórios de adesão** e conformidade para RH.
4. **Delegação temporária** de aprovação entre gestores.

---

## 5. Visão de longo prazo

- Evoluir para uma arquitetura orientada a domínio com use cases explícitos.
- Introduzir métricas e tracing para acompanhar uso real e gargalos.
- Considerar suporte multi-tenant caso o sistema seja expandido para outras unidades/empresas.

