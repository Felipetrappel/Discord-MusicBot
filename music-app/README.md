# Music App

Player de música simples em HTML/CSS/JS com playlist, controles, barra de progresso, volume e visualizador usando Web Audio API.

## Executar localmente

1. Abra um servidor HTTP na pasta pai de `music-app` (necessário para algumas APIs e CORS):

```bash
cd /workspace && python3 -m http.server 8080
```

2. Acesse `http://localhost:8080/music-app/` no navegador.

> Dica: clique em ▶️ para iniciar o áudio (alguns navegadores exigem gesto do usuário para ativar o AudioContext).

## Estrutura

- `index.html`: marcação da interface
- `styles.css`: estilos do player e playlist
- `app.js`: lógica do player, playlist e visualizador
- `assets/`: ícones e placeholders

## Playlist de exemplo

A playlist usa faixas de demonstração do SoundHelix (domínio público para testes). Caso queira, edite o array `tracks` em `app.js` para usar seus próprios arquivos locais ou URLs com cabeçalhos CORS apropriados. Para arquivos locais, coloque-os em `assets/` e aponte a `url` para o caminho relativo.

## Atalhos

- Espaço: Play/Pause
- ←/→: retroceder/avançar 5s

## Licença

Uso livre para fins de estudo e demonstração.
