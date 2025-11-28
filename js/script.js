// ============================================
// ESTADO DEL JUEGO
// ============================================
const gameState = {
  palabras: {},
  dificultad: 'facil',
  palabraActual: '',
  palabraActualId: '',
  letrasAdivinadas: [],
  fallos: 0,
  maxFallos: 6,
  storageKey: 'ahorcado_juego_guardado'
};

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const DOM = {
  pantallaInicio: document.getElementById('pantallaInicio'),
  pantallaJuego: document.getElementById('pantallaJuego'),
  pantallaResultado: document.getElementById('pantallaResultado'),
  letrasPalabra: document.getElementById('letrasPalabra'),
  teclado: document.getElementById('teclado'),
  contadorFallos: document.getElementById('contadorFallos'),
  tarjetaGanaste: document.getElementById('tarjetaGanaste'),
  tarjetaPerdiste: document.getElementById('tarjetaPerdiste'),
  modalSalir: document.getElementById('modalSalir'),
  palabraGanaste: document.getElementById('palabraGanaste'),
  palabraPerdiste: document.getElementById('palabraPerdiste')
};

// ============================================
// UTILIDADES
// ============================================
const utils = {
  toggleScreen(hide, show) {
    hide.forEach(el => el?.classList.add('oculto'));
    show.forEach(el => el?.classList.remove('oculto'));
  },

  resetGame() {
    gameState.fallos = 0;
    gameState.letrasAdivinadas = [];
    this.resetDibujo();
  },

  resetDibujo() {
    document.querySelectorAll('.parte-cuerpo')
      .forEach(p => p.classList.remove('visible'));
  },

  mostrarParteCuerpo(n) {
    const partes = document.querySelectorAll('.parte-cuerpo');
    if (n > 0 && n <= partes.length) partes[n - 1].classList.add('visible');
  },

  actualizarContador() {
    DOM.contadorFallos.textContent = gameState.fallos;
  }
};

// ============================================
// STORAGE
// ============================================
const storage = {
  guardar() {
    const estado = {
      dificultad: gameState.dificultad,
      palabraId: gameState.palabraActualId,
      letrasAdivinadas: gameState.letrasAdivinadas,
      fallos: gameState.fallos
    };
    localStorage.setItem(gameState.storageKey, JSON.stringify(estado));
  },

  cargar() {
    const data = localStorage.getItem(gameState.storageKey);
    return data ? JSON.parse(data) : null;
  },

  limpiar() {
    localStorage.removeItem(gameState.storageKey);
    this.actualizarUI();
  },

  existe() {
    return localStorage.getItem(gameState.storageKey) !== null;
  },

  // 🔥 mejora: evita error si btn no existe
  actualizarUI() {
    const btnContinuar = document.getElementById('btnContinuar');
    if (!btnContinuar) return;
    btnContinuar.style.display = this.existe() ? 'initial' : 'none';
  }
};

// ============================================
// PALABRAS
// ============================================
const palabrasManager = {
  async cargar() {
    try {
      const r = await fetch('./js/palabras.json');
      gameState.palabras = await r.json();
    } catch (e) {
      console.error('Error al cargar palabras:', e);

      // 🔥 palabras fallback seguras
      gameState.palabras = {
        facil: [
          { id: 'f001', palabra: 'GATOS' },
          { id: 'f002', palabra: 'PERRO' },
          { id: 'f003', palabra: 'ROBOT' }
        ],
        intermedio: [
          { id: 'i001', palabra: 'JAVASCRIPT' },
          { id: 'i002', palabra: 'MONTANA' }
        ],
        dificil: [
          { id: 'd001', palabra: 'PROGRAMADOR' },
          { id: 'd002', palabra: 'TECNOLOGIA' }
        ]
      };
    }

    storage.actualizarUI();
  },

  // 🔥 evita errores si json o dificultad está vacío
  seleccionarAleatoria() {
    const arr = gameState.palabras[gameState.dificultad] ?? [];
    if (arr.length === 0) return { palabra: 'VACIO', id: 'null' };
    return arr[Math.floor(Math.random() * arr.length)];
  },

  buscarPorId(id) {
    return gameState.palabras[gameState.dificultad]?.find(p => p.id === id);
  }
};

// ============================================
// JUEGO
// ============================================
const game = {
  iniciar() {
    storage.limpiar();
    utils.resetGame();

    const palabra = palabrasManager.seleccionarAleatoria();
    gameState.palabraActual = palabra.palabra;
    gameState.palabraActualId = palabra.id;

    utils.toggleScreen(
      [DOM.pantallaInicio, DOM.pantallaResultado],
      [DOM.pantallaJuego]
    );

    this.crearEspacios();
    this.crearTeclado();
    utils.actualizarContador();
  },

  continuar() {
    const estado = storage.cargar();
    if (!estado) return;

    gameState.dificultad = estado.dificultad;
    gameState.palabraActualId = estado.palabraId;
    gameState.letrasAdivinadas = estado.letrasAdivinadas;
    gameState.fallos = estado.fallos;

    const palabraObj = palabrasManager.buscarPorId(estado.palabraId);
    gameState.palabraActual = palabraObj?.palabra || '';

    utils.toggleScreen([DOM.pantallaInicio], [DOM.pantallaJuego]);

    this.crearEspacios();
    this.mostrarProgreso();
    this.crearTeclado();
    this.restaurarTeclado();
    this.restaurarDibujo();
    utils.actualizarContador();
  },

  crearEspacios() {
    DOM.letrasPalabra.innerHTML = '';
    gameState.palabraActual.split('').forEach(l => {
      const e = document.createElement('div');
      e.className = 'letra-espacio';
      e.dataset.letra = l;
      DOM.letrasPalabra.appendChild(e);
    });
  },

  crearTeclado() {
    DOM.teclado.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
      const b = document.createElement('button');
      b.className = 'tecla';
      b.textContent = l;
      b.dataset.letra = l;
      b.addEventListener('click', () => this.verificarLetra(l, b));
      DOM.teclado.appendChild(b);
    });
  },

  verificarLetra(letra, tecla) {
    if (gameState.letrasAdivinadas.includes(letra)) return;

    gameState.letrasAdivinadas.push(letra);
    tecla.classList.add('deshabilitada');

    if (gameState.palabraActual.includes(letra)) {
      tecla.classList.add('correcta');
      this.mostrarLetras(letra);

      if (this.verificarVictoria()) {
        storage.limpiar();
        setTimeout(() => this.mostrarResultado(true), 500);
      } else storage.guardar();

    } else {
      tecla.classList.add('incorrecta');
      gameState.fallos++;
      utils.mostrarParteCuerpo(gameState.fallos);
      utils.actualizarContador();

      if (gameState.fallos >= gameState.maxFallos) {
        storage.limpiar();
        setTimeout(() => this.mostrarResultado(false), 500);
      } else storage.guardar();
    }
  },

  mostrarLetras(letra) {
    document.querySelectorAll('.letra-espacio').forEach(e => {
      if (e.dataset.letra === letra) e.textContent = letra;
    });
  },

  mostrarProgreso() {
    gameState.letrasAdivinadas.forEach(l =>
      gameState.palabraActual.includes(l) && this.mostrarLetras(l)
    );
  },

  restaurarTeclado() {
    setTimeout(() => {
      gameState.letrasAdivinadas.forEach(l => {
        const t = document.querySelector(`button[data-letra="${l}"]`);
        if (!t) return;
        t.classList.add('deshabilitada');
        t.classList.add(gameState.palabraActual.includes(l) ? 'correcta' : 'incorrecta');
      });
    }, 50);
  },

  restaurarDibujo() {
    utils.resetDibujo();
    for (let i = 1; i <= gameState.fallos; i++) utils.mostrarParteCuerpo(i);
  },

  verificarVictoria() {
    return [...document.querySelectorAll('.letra-espacio')]
      .every(e => e.textContent !== '');
  },

  // 🔥 mejora total del sistema de resultado
  mostrarResultado(gano) {
    DOM.tarjetaGanaste.classList.add('oculto');
    DOM.tarjetaPerdiste.classList.add('oculto');

    utils.toggleScreen([DOM.pantallaJuego], [DOM.pantallaResultado]);

    if (gano) {
      DOM.tarjetaGanaste.classList.remove('oculto');
      DOM.palabraGanaste.textContent = gameState.palabraActual;
    } else {
      DOM.tarjetaPerdiste.classList.remove('oculto');
      DOM.palabraPerdiste.textContent = gameState.palabraActual;
    }
  },

  volverMenu() {
    utils.toggleScreen(
      [DOM.pantallaResultado, DOM.pantallaJuego],
      [DOM.pantallaInicio]
    );
    storage.actualizarUI();
  }
};

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  document.querySelectorAll('.btn-dificultad').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-dificultad')
        .forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      gameState.dificultad = btn.dataset.dificultad;
    });
  });

  document.getElementById('btnEmpezar').addEventListener('click', () => game.iniciar());
  document.getElementById('btnContinuar').addEventListener('click', () => game.continuar());

  document.getElementById('btnSalir').addEventListener('click', () =>
    DOM.modalSalir.classList.remove('oculto')
  );

  document.getElementById('btnGuardarSalir').addEventListener('click', () => {
    storage.guardar();
    DOM.modalSalir.classList.add('oculto');
    game.volverMenu();
  });

  document.getElementById('btnNoGuardarSalir').addEventListener('click', () => {
    storage.limpiar();
    DOM.modalSalir.classList.add('oculto');
    game.volverMenu();
  });

  document.getElementById('btnCancelar').addEventListener('click', () =>
    DOM.modalSalir.classList.add('oculto')
  );

  document.getElementById('btnJugarOtroGanaste').addEventListener('click', () => game.iniciar());
  document.getElementById('btnJugarOtroPerdiste').addEventListener('click', () => game.iniciar());
  document.getElementById('btnMenuGanaste').addEventListener('click', () => game.volverMenu());
  document.getElementById('btnMenuPerdiste').addEventListener('click', () => game.volverMenu());

  document.getElementById('year').textContent = new Date().getFullYear();
}

// ============================================
// INICIALIZACIÓN
// ============================================
async function init() {
  await palabrasManager.cargar();
  setupEventListeners();
}

init();