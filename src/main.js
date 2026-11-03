/**
 * Ponto de entrada da aplicação.
 */
import { Game } from './core/Game.js';
import { DEBUG } from './config.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

game.start().catch((error) => {
  console.error(error);
  const message = document.getElementById('error');
  if (message) {
    message.hidden = false;
    message.textContent = 'Não foi possível iniciar o jogo. Veja o console (F12) para detalhes.';
  }
});

if (DEBUG) {
  // Expõe o jogo no console para inspeção durante o desenvolvimento.
  window.game = game;
}
