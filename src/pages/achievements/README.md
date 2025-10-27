Esta página fornece uma interface para professores gerenciarem as conquistas do jogo.

Expectativas de endpoints backend:

- GET  /gamification/achievements -> lista de conquistas (pode retornar { data: [...] } ou [...])
- POST /gamification/achievements -> criar conquista (body: { title, points, ... })
- PUT  /gamification/achievements/:id -> atualizar conquista
- DELETE /gamification/achievements/:id -> apagar conquista

Instruções de uso:

1. Importar `TeacherAchievements` na rota do professor ou no painel admin do frontend.
2. Ajustar/garantir endpoints no backend conforme acima.
