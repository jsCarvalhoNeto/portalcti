# Configuração para Deploy no Railway

## Variáveis de Ambiente

Para que o frontend funcione corretamente tanto em ambiente local quanto no Railway, é necessário configurar as variáveis de ambiente apropriadas.

### Ambiente Local
O arquivo `.env` deve conter:
```
VITE_API_URL="http://localhost:4002/api"
```

### Ambiente de Produção (Railway)
No painel do Railway, na seção de variáveis de ambiente do seu frontend, configure:
```
VITE_API_URL="https://cursotecnicoinfobva-backend-production.up.railway.app/api"
```

Observação importante para autenticação via cookies:

- No backend (projeto `cursotecnicoinfobva-backend`) você deve configurar as seguintes variáveis de ambiente no Railway:
   - `CORS_ORIGIN` = URL do seu frontend (ex: `https://seu-frontend-production.up.railway.app`)
   - `NODE_ENV` = `production`

- O backend precisa enviar cookies de sessão cross-site. Para isso ele deve:
   - aceitar credenciais CORS (Access-Control-Allow-Credentials: true)
   - definir o cookie com `SameSite=None` e `Secure=true` quando em produção

Sem essas configurações, requisições como `GET /api/auth/me` podem retornar 401 no frontend hospedado em outro domínio porque o cookie de sessão não será enviado pelo navegador.

## Configuração no Railway

1. Acesse o painel do Railway
2. Selecione seu projeto de frontend
3. Vá até a aba "Settings" ou "Environment Variables"
4. Adicione a variável:
   - Key: `VITE_API_URL`
   - Value: `https://cursotecnicoinfobva-backend-production.up.railway.app/api`

## Testando a Conexão

Após configurar a variável de ambiente no Railway, faça o deploy novamente e verifique se as funcionalidades como a área de atividades estão funcionando corretamente.

## Troubleshooting

Se ainda houver problemas de conexão:

1. Verifique se o backend está rodando corretamente no Railway
2. Confirme que a URL do backend está acessível
3. Verifique os logs do frontend no Railway para mensagens de erro específicas
4. Certifique-se de que não há problemas de CORS no backend

## Dica para Desenvolvimento

Para facilitar o desenvolvimento, você pode manter o arquivo `.env.example` atualizado com todas as variáveis necessárias:

```
# Para ambiente local
VITE_API_URL="http://localhost:4002/api"

# Para ambiente de produção (Railway)
# VITE_API_URL="https://cursotecnicoinfobva-backend-production.up.railway.app/api"
```

## Verificação Completa

Todos os serviços do frontend foram atualizados para usar a variável de ambiente `VITE_API_URL` em vez de endpoints fixos. Os seguintes arquivos foram modificados:

- `src/services/authService.ts`
- `src/services/studentService.ts` 
- `src/services/activityService.ts`
- `src/services/subjectService.ts`
- `src/services/teacherService.ts`
- `src/services/userService.ts`
- `src/services/studentProfileService.ts`
- `src/services/teacherDashboardService.ts`

Isso garante que o frontend funcione corretamente tanto em ambiente local quanto no Railway, usando a mesma base de código.
