# Arquitetura de Jogos Educativos

## Estado encontrado

O portal é uma SPA React/Vite. O professor acessa `EducationalGamesUtility`, que grava HTML completo em `educational_games`; o aluno abre `/jogos/:shareCode`, e `EducationalGamePlayer` executa esse HTML por `srcDoc` em um iframe com sandbox. A RLS permite que o professor administre seus jogos e que visitantes leiam apenas os publicados.

“Em Busca da Faculdade” é hoje um template HTML autocontido. Ele cria um cliente Supabase Realtime dentro do iframe, usa broadcast sem confirmação e mantém o professor como autoridade informal do estado. Isso funciona como protótipo, mas reconexão, retomada, ordenação de eventos e auditoria ainda não são garantidas.

## Fundação implementada

- Catálogo continua aceitando HTML livre, mas passa a identificar `template_key`, `template_version`, capacidades e configurações.
- O player injeta `window.EducationalGame` antes do jogo, com protocolo `educational-game:v1` para `ready`, `progress`, `score`, `complete`, `error` e `resize`.
- Mensagens só são aceitas quando vêm do `contentWindow` do iframe e obedecem ao contrato conhecido.
- O runtime informa papel, sala, idioma e preferência por movimento reduzido. Jogos antigos podem ignorar tudo isso.
- Publicação ganha data explícita e cada alteração incrementa `revision`.

Exemplo para um novo template:

```html
<script>
  EducationalGame.ready({ level: 1 });
  EducationalGame.progress({ level: 1, percent: 50 });
  EducationalGame.score({ points: 100 });
  EducationalGame.complete({ passed: true, points: 100 });
</script>
```

## Arquitetura alvo incremental

1. **Catálogo e autoria:** separar definição do template, configuração pedagógica e versão publicada. O professor edita uma instância; publicar cria uma versão imutável para que uma aula em andamento não mude.
2. **Runtime do portal:** manter o iframe como fronteira de isolamento. O jogo conversa apenas pelo protocolo versionado; credenciais, persistência e Realtime migram gradualmente para adaptadores no processo pai.
3. **Sessões:** criar `game_sessions`, `game_participants`, `game_events` e snapshots. Cada evento terá `session_id`, `client_id`, número sequencial e chave de idempotência. O servidor/RPC valida comandos e o host publica snapshots periódicos.
4. **Multiplayer:** Supabase Presence apenas para presença efêmera; Broadcast para baixa latência; banco/RPC para comandos importantes e resultado final. Na reconexão, o cliente carrega o último snapshot e reaplica eventos posteriores.
5. **Controles e acessibilidade:** todo template declara capacidades. Teclado, toque e gamepad são adaptadores; ações são semânticas (`move`, `confirm`, `pause`), remapeáveis, com foco visível, alternativa a cor/som e respeito a movimento reduzido.
6. **Observabilidade:** eventos de erro e conclusão chegam ao portal; métricas não incluem código HTML nem dados pessoais desnecessários.

## Ordem segura de implantação

1. Aplicar `20260821000000_evolve_educational_games_catalog.sql`.
2. Publicar o frontend com o runtime v1.
3. Migrar “Em Busca da Faculdade” para o adaptador Realtime do portal mantendo a versão atual disponível.
4. Adicionar tabelas de sessão/snapshot e testes de reconexão antes de tornar resultados multiplayer avaliativos.

## Critérios para o próximo template

- Funciona em 320 px de largura e com teclado.
- Não depende de uma URL/CDN sem tratamento de falha.
- Emite prontidão, progresso, conclusão e erro pelo runtime.
- Não recebe chaves de serviço ou credenciais privilegiadas.
- Continua jogável ou apresenta recuperação clara após perda de conexão.
