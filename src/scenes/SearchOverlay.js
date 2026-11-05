/**
 * Caixa de busca da lupa do menu principal.
 *
 * É um campo de texto do HTML (não do canvas) para que o teclado do celular
 * apareça ao tocar nele. A busca em si não procura nada... quase nada.
 */
import { hashString } from '../utils/math.js';

const CODES = new Set([517278592, 956941540, 2675534342, 3943783598]);

/** Deixa só letras e números, em maiúsculas ("14/11/2026" -> "14112026"). */
export const normalizeQuery = (text) => text.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isSecretQuery = (text) => CODES.has(hashString(normalizeQuery(text)));

let open = null;

export const isSearchOpen = () => Boolean(open);

/**
 * Abre a caixa de busca.
 * @param {{onSecret: Function, onClose?: Function}} callbacks
 */
export function openSearch({ onSecret, onClose }) {
  if (open || typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.innerHTML = `
    <form class="search-box" autocomplete="off">
      <p class="search-title">BUSCAR</p>
      <input class="search-input" type="text" maxlength="24" placeholder="Digite aqui..." enterkeyhint="search" autocapitalize="characters" spellcheck="false">
      <p class="search-result" aria-live="polite"></p>
      <div class="search-actions">
        <button type="submit">BUSCAR</button>
        <button type="button" data-close>FECHAR</button>
      </div>
    </form>`;
  const form = overlay.querySelector('form');
  const input = overlay.querySelector('input');
  const result = overlay.querySelector('.search-result');

  const close = () => {
    overlay.remove();
    open = null;
    window.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      onClose?.();
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSecretQuery(input.value)) {
      input.blur();
      overlay.classList.add('found');
      result.textContent = '❤';
      setTimeout(() => {
        close();
        onSecret();
      }, 700);
      return;
    }
    result.textContent = input.value.trim() ? 'Nenhum resultado encontrado.' : '';
    form.classList.remove('shake');
    void form.offsetWidth; // reinicia a animação
    form.classList.add('shake');
  });
  overlay.querySelector('[data-close]').addEventListener('click', () => {
    close();
    onClose?.();
  });
  // Clique fora da caixa fecha.
  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) {
      close();
      onClose?.();
    }
  });
  window.addEventListener('keydown', onKey, true);

  document.body.appendChild(overlay);
  open = overlay;
  input.focus();
}
