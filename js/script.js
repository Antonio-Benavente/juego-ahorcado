// Variables del juego
let palabras = {};
let dificultadSeleccionada = 'facil';
let palabraActual = '';
let palabraActualId = ''; 
let letrasAdivinadas = [];
let fallos = 0;
const maxFallos = 6;
const STORAGE_KEY = 'ahorcado_juego_guardado';

// Elementos del DOM
const pantallaInicio = document.getElementById('pantallaInicio');
const pantallaJuego = document.getElementById('pantallaJuego');
const pantallaResultado = document.getElementById('pantallaResultado');
const btnEmpezar = document.getElementById('btnEmpezar');
const btnContinuar = document.getElementById('btnContinuar');
const btnSalir = document.getElementById('btnSalir');
const letrasPalabra = document.getElementById('letrasPalabra');
const teclado = document.getElementById('teclado');
const contadorFallos = document.getElementById('contadorFallos');
const tarjetaGanaste = document.getElementById('tarjetaGanaste');
const tarjetaPerdiste = document.getElementById('tarjetaPerdiste');
const modalSalir = document.getElementById('modalSalir');
const btnGuardarSalir = document.getElementById('btnGuardarSalir');
const btnNoGuardarSalir = document.getElementById('btnNoGuardarSalir');
const btnCancelar = document.getElementById('btnCancelar');

// Establecer el año actual
document.getElementById("year").textContent = new Date().getFullYear();

// Cargar palabras desde JSON
async function cargarPalabras() {
    try {
        const response = await fetch('./palabras.json');
        palabras = await response.json();
        verificarJuegoGuardado();
    } catch (error) {
        console.error('Error al cargar palabras:', error);
        // Palabras de respaldo si falla la carga
        palabras = {
            facil: ['GATOS', 'PERRO', 'ROBOT', 'DULCE', 'LIBRO'],
            intermedio: ['JAVASCRIPT', 'MONTANA', 'GUITARRA', 'VENTANA'],
            dificil: ['PROGRAMADOR', 'TECNOLOGIA', 'DINOSAURIO']
        };
        verificarJuegoGuardado();
    }
}

// Verificar si hay un juego guardado
function verificarJuegoGuardado() {
    const juegoGuardado = localStorage.getItem(STORAGE_KEY);
    if (juegoGuardado) {
        btnContinuar.style.display = 'initial';
    } else {
        btnContinuar.style.display = 'none';
    }
}

// Guardar el estado del juego
function guardarJuego() {
    const estadoJuego = {
        dificultad: dificultadSeleccionada,
        palabraId: palabraActualId, // ⭐ Guardamos el ID, no la palabra
        letrasAdivinadas: letrasAdivinadas,
        fallos: fallos
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoJuego));
}

// Cargar juego guardado
function cargarJuegoGuardado() {
    const juegoGuardado = localStorage.getItem(STORAGE_KEY);
    if (juegoGuardado) {
        const estado = JSON.parse(juegoGuardado);
        dificultadSeleccionada = estado.dificultad;
        palabraActualId = estado.palabraId;
        
        // ⭐ Buscar la palabra usando el ID
        const palabraObj = palabras[dificultadSeleccionada].find(p => p.id === palabraActualId);
        palabraActual = palabraObj ? palabraObj.palabra : '';
        
        letrasAdivinadas = estado.letrasAdivinadas;
        fallos = estado.fallos;
        
        // Mostrar pantalla de juego
        pantallaInicio.classList.add('oculto');
        pantallaJuego.classList.remove('oculto');
        
        // Recrear el estado del juego
        crearEspaciosLetras();
        
        // Mostrar las letras correctas que ya fueron adivinadas
        letrasAdivinadas.forEach(letra => {
            if (palabraActual.includes(letra)) {
                mostrarLetrasCorrectas(letra);
            }
        });
        
        // Crear teclado
        crearTeclado();
        
        // ⭐ USAR setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
            // Restaurar estado de las teclas DESPUÉS de que el teclado se haya renderizado
            letrasAdivinadas.forEach(letra => {
                // ⭐ Buscar específicamente en los BOTONES del teclado, no en los espacios de letras
                const tecla = document.querySelector(`button.tecla[data-letra="${letra}"]`);
                if (tecla) {
                    tecla.classList.add('deshabilitada');
                    if (palabraActual.includes(letra)) {
                        tecla.classList.add('correcta');
                    } else {
                        tecla.classList.add('incorrecta');
                    }
                }
            });
        }, 50); // Pequeño delay para asegurar que el DOM esté actualizado
        
        // Restaurar dibujo
        resetearDibujo();
        for (let i = 1; i <= fallos; i++) {
            mostrarParteCuerpo(i);
        }
        
        actualizarContador();
    }
}

// Limpiar juego guardado
function limpiarJuegoGuardado() {
    localStorage.removeItem(STORAGE_KEY);
    verificarJuegoGuardado();
}

// Botones de dificultad
const botonesDificultad = document.querySelectorAll('.btn-dificultad');
botonesDificultad.forEach(btn => {
    btn.addEventListener('click', () => {
        botonesDificultad.forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        dificultadSeleccionada = btn.dataset.dificultad;
    });
});

// Event Listeners
btnEmpezar.addEventListener('click', iniciarJuego);
btnContinuar.addEventListener('click', cargarJuegoGuardado);
btnSalir.addEventListener('click', () => modalSalir.classList.remove('oculto'));
btnGuardarSalir.addEventListener('click', () => {
    guardarJuego();
    modalSalir.classList.add('oculto');
    volverAlMenu();
});
btnNoGuardarSalir.addEventListener('click', () => {
    limpiarJuegoGuardado();
    modalSalir.classList.add('oculto');
    volverAlMenu();
});
btnCancelar.addEventListener('click', () => modalSalir.classList.add('oculto'));

document.getElementById('btnJugarOtroGanaste').addEventListener('click', iniciarJuego);
document.getElementById('btnJugarOtroPerdiste').addEventListener('click', iniciarJuego);
document.getElementById('btnMenuGanaste').addEventListener('click', volverAlMenu);
document.getElementById('btnMenuPerdiste').addEventListener('click', volverAlMenu);

function iniciarJuego() {
    // Limpiar juego guardado anterior
    limpiarJuegoGuardado();
    
    // Resetear variables
    fallos = 0;
    letrasAdivinadas = [];
    
    // ⭐ Seleccionar palabra aleatoria (ahora es un objeto con id y palabra)
    const palabrasArray = palabras[dificultadSeleccionada];
    const palabraObj = palabrasArray[Math.floor(Math.random() * palabrasArray.length)];
    palabraActual = palabraObj.palabra;
    palabraActualId = palabraObj.id;
    
    // Mostrar pantalla de juego
    pantallaInicio.classList.add('oculto');
    pantallaResultado.classList.add('oculto');
    pantallaJuego.classList.remove('oculto');
    
    // Crear espacios para las letras
    crearEspaciosLetras();
    
    // Crear teclado
    crearTeclado();
    
    // Resetear dibujo
    resetearDibujo();
    
    // Actualizar contador
    actualizarContador();
}

function crearEspaciosLetras() {
    letrasPalabra.innerHTML = '';
    for (let i = 0; i < palabraActual.length; i++) {
        const espacio = document.createElement('div');
        espacio.className = 'letra-espacio';
        espacio.dataset.letra = palabraActual[i];
        letrasPalabra.appendChild(espacio);
    }
}

function crearTeclado() {
    teclado.innerHTML = '';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let letra of letras) {
        const tecla = document.createElement('button');
        tecla.className = 'tecla';
        tecla.textContent = letra;
        tecla.dataset.letra = letra;
        tecla.addEventListener('click', () => verificarLetra(letra, tecla));
        teclado.appendChild(tecla);
    }
}

function verificarLetra(letra, tecla) {
    if (letrasAdivinadas.includes(letra)) return;
    
    letrasAdivinadas.push(letra);
    tecla.classList.add('deshabilitada');
    
    if (palabraActual.includes(letra)) {
        // Letra correcta
        tecla.classList.add('correcta');
        mostrarLetrasCorrectas(letra);
        
        // Verificar si ganó
        if (verificarVictoria()) {
            limpiarJuegoGuardado();
            setTimeout(() => mostrarResultado(true), 500);
        } else {
            // Guardar progreso
            guardarJuego();
        }
    } else {
        // Letra incorrecta
        tecla.classList.add('incorrecta');
        fallos++;
        actualizarContador();
        mostrarParteCuerpo(fallos);
        
        // Verificar si perdió
        if (fallos >= maxFallos) {
            limpiarJuegoGuardado();
            setTimeout(() => mostrarResultado(false), 500);
        } else {
            // Guardar progreso
            guardarJuego();
        }
    }
}

function mostrarLetrasCorrectas(letra) {
    const espacios = document.querySelectorAll('.letra-espacio');
    espacios.forEach(espacio => {
        if (espacio.dataset.letra === letra) {
            espacio.textContent = letra;
        }
    });
}

function verificarVictoria() {
    const espacios = document.querySelectorAll('.letra-espacio');
    for (let espacio of espacios) {
        if (espacio.textContent === '') {
            return false;
        }
    }
    return true;
}

function actualizarContador() {
    contadorFallos.textContent = fallos;
}

function resetearDibujo() {
    const partes = document.querySelectorAll('.parte-cuerpo');
    partes.forEach(parte => parte.classList.remove('visible'));
}

function mostrarParteCuerpo(numeroFallo) {
    const partes = document.querySelectorAll('.parte-cuerpo');
    if (numeroFallo > 0 && numeroFallo <= partes.length) {
        partes[numeroFallo - 1].classList.add('visible');
    }
}

function mostrarResultado(gano) {
    pantallaJuego.classList.add('oculto');
    pantallaResultado.classList.remove('oculto');
    
    if (gano) {
        tarjetaGanaste.classList.remove('oculto');
        tarjetaPerdiste.classList.add('oculto');
        document.getElementById('palabraGanaste').textContent = palabraActual;
    } else {
        tarjetaPerdiste.classList.remove('oculto');
        tarjetaGanaste.classList.add('oculto');
        document.getElementById('palabraPerdiste').textContent = palabraActual;
    }
}

function volverAlMenu() {
    pantallaResultado.classList.add('oculto');
    pantallaJuego.classList.add('oculto');
    pantallaInicio.classList.remove('oculto');
    verificarJuegoGuardado();
}

// Inicializar el juego
cargarPalabras();