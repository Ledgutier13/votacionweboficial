import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB1qWP8M3jEauxL1QzCOz-zb-kI9MumwyY",
    authDomain: "votaciononline-502dd.firebaseapp.com",
    databaseURL: "https://votaciononline-502dd-default-rtdb.firebaseio.com",
    projectId: "votaciononline-502dd",
    storageBucket: "votaciononline-502dd.appspot.com",
    messagingSenderId: "223964095350",
    appId: "1:223964095350:web:6db96fb5b4fa8bd5895057"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Función para mostrar el cuadro de diálogo (modal)
function mostrarModal(mensaje) {
    document.getElementById('modal-texto').innerText = mensaje;
    document.getElementById('modal').style.display = 'block';
}

// Función para cerrar el cuadro de diálogo (modal)
window.cerrarModal = function() {
    const mensaje = document.getElementById('modal-texto').innerText;
    document.getElementById('modal').style.display = 'none';
    if (mensaje === "Usted ya ha votado." || mensaje === "Lo siento, la votación ha terminado con la verificación de los resultados.") {
        location.href = 'index.html';
    }
};

// Función para generar un código aleatorio
function generarCodigoAleatorio() {
    return `VOTACION-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

// Función para crear una nueva votación
window.crearVotacion = async function() {
    const titulo = document.getElementById('tituloVotacion').value;
    const descripcion = document.getElementById('descripcionVotacion').value;

    await set(ref(db, 'votacion'), {
        si: 0,
        no: 0,
        abstencion: 0,
        dequetrata: {
            subtitulo: descripcion,
            titulo: titulo,
            codigo: "",
            codigousado: false,
            generacion: false
        }
    });

    const dbRef = ref(db);
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    usuariosSnapshot.forEach((childSnapshot) => {
        update(ref(db, `usuarios/${childSnapshot.key}`), { havotado: false });
    });

    document.getElementById('mensajeAprobacion').style.display = 'none';
    mostrarModal("Votación creada exitosamente.");
};



// Función para generar un código aleatorio
window.generarCodigo = async function() {
    const dbRef = ref(db);
    const votacionSnapshot = await get(child(dbRef, 'votacion/dequetrata'));

    if (votacionSnapshot.exists() && votacionSnapshot.val().titulo !== "No hay datos") {
        if (votacionSnapshot.val().generacion) {
            mostrarModal("Ya se ha generado un código para esta votación.");
        } else {
            const codigo = generarCodigoAleatorio();
            await update(ref(db, 'votacion/dequetrata'), {
                codigo: codigo,
                generacion: true,
                codigousado: false
            });
            document.getElementById('codigoGenerado').innerText = `Código Generado: ${codigo}`;
        }
    } else {
        mostrarModal("No hay votación activa.");
    }
};

// Función para verificar el código
window.validarCodigo = async function() {
    const codigoIngresado = document.getElementById('codigoIngresado').value;
    const dbRef = ref(db);
    const votacionSnapshot = await get(child(dbRef, 'votacion/dequetrata'));

    if (votacionSnapshot.exists() && votacionSnapshot.val().codigo === codigoIngresado && !votacionSnapshot.val().codigousado) {
        await update(ref(db, 'votacion/dequetrata'), { codigousado: true });
        document.getElementById('codigoSection').style.display = 'none';
        document.getElementById('resultados').style.display = 'block';
        mostrarResultados();
    } else {
        mostrarModal("Código inválido o ya usado.");
    }
};


// Función para cerrar el modal de propuestas
window.cerrarModalPropuestas = function() {
    document.getElementById('modalPropuestas').style.display = 'none';
};


// Función para seleccionar una opción de voto
window.seleccionarOpcion = function(opcion) {
    const botones = document.querySelectorAll('#votacion button');
    botones.forEach(boton => boton.classList.remove('selected'));
    document.querySelector(`#votacion button[onclick="seleccionarOpcion('${opcion}')"]`).classList.add('selected');
    window.voto = opcion;
    document.getElementById('votar-button').classList.add('selected');
};

// Función para registrar el voto
window.votar = async function() {
    const usuario = document.getElementById('usuario').value;
    const dbRef = ref(db);

    if (window.voto) {
        const updates = {};
        updates[`usuarios/${usuario}/havotado`] = true;
        updates[`votacion/${window.voto}`] = (await get(child(dbRef, `votacion/${window.voto}`))).val() + 1;
        await update(dbRef, updates);
        mostrarModal("Gracias por su voto!");
        location.href = 'index.html';
    } else {
        mostrarModal("Por favor, seleccione una opción para votar.");
    }
};

// Función para login de administrador
window.loginAdmin = async function() {
    const usuario = document.getElementById('adminUsuario').value;
    const contrasena = document.getElementById('adminContrasena').value;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `admin`));

    if (snapshot.exists() && snapshot.val().user === usuario && snapshot.val().contrasena === contrasena) {
        document.getElementById('login').style.display = 'none';
        if (document.getElementById('registro')) {
            document.getElementById('registro').style.display = 'block';
            cargarUsuarios();
        } else if (document.getElementById('crearVotacion')) {
            document.getElementById('crearVotacion').style.display = 'block';
            mostrarVotacionActual();
        } else if (document.getElementById('resultados')) {
            document.getElementById('resultados').style.display = 'block';
            mostrarResultados();
        }
    } else {
        mostrarModal("Usuario o contraseña incorrectos.");
    }
};


// Función para registrar un nuevo usuario
window.registrarUsuario = async function() {
    const nombreCompleto = document.getElementById('nombreCompleto').value;
    const nuevoUsuario = document.getElementById('nuevoUsuario').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const bibliografia = document.getElementById('bibliografia').value;
    const rolUsuario = document.getElementById('rolUsuario').value;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `usuarios/${nuevoUsuario}`));

    if (snapshot.exists()) {
        mostrarModal("El usuario ya existe.");
    } else {
        await set(ref(db, `usuarios/${nuevoUsuario}`), {
            nombre: nombreCompleto,
            contrasena: nuevaContrasena,
            havotado: false,
            id: nuevoUsuario,
            bibliografia: bibliografia,
            rol: rolUsuario
        });
        mostrarModal("Usuario registrado exitosamente.");
        cargarUsuarios();
    }
};

// Función para cargar los usuarios en la tabla
async function cargarUsuarios() {
    const dbRef = ref(db);
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    const tbody = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

    usuariosSnapshot.forEach((childSnapshot) => {
        const usuario = childSnapshot.key;
        const row = tbody.insertRow();
        const cellUsuario = row.insertCell(0);
        const cellAcciones = row.insertCell(1);

        cellUsuario.textContent = usuario;
        cellAcciones.innerHTML = `
            <button onclick="editarUsuario('${usuario}')">Editar</button>
            <button onclick="borrarUsuario('${usuario}')">Borrar</button>
        `;
    });
}

// Función para editar un usuario
window.editarUsuario = async function(usuario) {
    const nuevaContrasena = prompt("Ingrese la nueva contraseña para " + usuario);
    if (nuevaContrasena) {
        await update(ref(db, `usuarios/${usuario}`), {
            contrasena: nuevaContrasena
        });
        mostrarModal("Contraseña actualizada exitosamente.");
        cargarUsuarios();
    }
};

// Función para borrar un usuario
window.borrarUsuario = async function(usuario) {
    if (confirm("¿Está seguro de que desea borrar el usuario " + usuario + "?")) {
        await remove(ref(db, `usuarios/${usuario}`));
        mostrarModal("Usuario borrado exitosamente.");
        cargarUsuarios();
    }
};

// Función para borrar la votación
window.borrarVotacion = async function() {
    await set(ref(db, 'votacion'), {
        si: 0,
        no: 0,
        abstencion: 0,
        dequetrata: {
            subtitulo: "No hay datos",
            titulo: "No hay datos",
            codigo: "",
            codigousado: false,
            generacion: false
        }
    });

    const dbRef = ref(db);
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    usuariosSnapshot.forEach((childSnapshot) => {
        update(ref(db, `usuarios/${childSnapshot.key}`), { havotado: false });
    });

    mostrarModal("Votación borrada exitosamente.");
    mostrarVotacionActual();
};

// Función para mostrar los resultados de la votación
async function mostrarResultados() {
    const dbRef = ref(db);
    const votacionSnapshot = await get(child(dbRef, 'votacion'));

    const si = votacionSnapshot.val().si;
    const no = votacionSnapshot.val().no;
    const abstencion = votacionSnapshot.val().abstencion;

    const ctx = document.getElementById('grafica').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sí', 'No', 'Abstención'],
            datasets: [{
                label: 'Votos',
                data: [si, no, abstencion],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    let mensajeResultado = '';
    if (si > no && si > abstencion) {
        mensajeResultado = 'La propuesta ha sido aprobada.';
    } else if (no > si && no > abstencion) {
        mensajeResultado = 'La propuesta ha sido rechazada.';
    } else if (si === no) {
        mensajeResultado = 'Hay un empate entre sí y no.';
    } else {
        mensajeResultado = 'No hay una decisión clara.';
    }

    document.getElementById('mensajeResultado').innerText = mensajeResultado;
}
// Función para mostrar la votación actual
async function mostrarVotacionActual() {
    const dbRef = ref(db);
    const votacionSnapshot = await get(child(dbRef, 'votacion/dequetrata'));
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));

    if (votacionSnapshot.exists() && votacionSnapshot.val().titulo !== "No hay datos") {
        document.getElementById('votacionActualTitulo').innerText = `Título: ${votacionSnapshot.val().titulo}`;
        document.getElementById('votacionActualSubtitulo').innerText = `Descripción: ${votacionSnapshot.val().subtitulo}`;
    } else {
        document.getElementById('votacionActualTitulo').innerText = "Título: No hay datos";
        document.getElementById('votacionActualSubtitulo').innerText = "Descripción: No hay datos";
    }

    const totalUsuarios = usuariosSnapshot.size;
    let usuariosQueHanVotado = 0;

    usuariosSnapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().havotado) {
            usuariosQueHanVotado++;
        }
    });

    const porcentajeVotacion = totalUsuarios > 0 ? (usuariosQueHanVotado / totalUsuarios) * 100 : 0;
    document.getElementById('estadisticasVotacion').innerHTML = `Esta votación ha sido votada por el <span style="color: red;">${porcentajeVotacion.toFixed(2)}%</span> de los usuarios (<span style="color: red;">${usuariosQueHanVotado}</span> de <span style="color: red;">${totalUsuarios}</span>).`;
}


    document.addEventListener('DOMContentLoaded', function() {
        // Función para login de usuario en perfil.html
        window.loginUsuarioPerfil = async function() {
            const usuario = document.getElementById('usuario').value;
            const contrasena = document.getElementById('contrasena').value;
    
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, `usuarios/${usuario}`));
    
            if (snapshot.exists() && snapshot.val().contrasena === contrasena) {
                document.getElementById('login').style.display = 'none';
                document.getElementById('perfil').style.display = 'block';
                document.getElementById('nombreUsuario').innerText = `Hola, ${snapshot.val().nombre}`;
                document.getElementById('rolUsuario').innerText = `Rol: ${snapshot.val().rol || 'Usuario'}`;
                document.getElementById('bibliografia').value = snapshot.val().bibliografia || '';
            } else {
                mostrarModal("Usuario o contraseña incorrectos.");
            }
        };
    });
// Función para cambiar la contraseña
window.cambiarContrasena = async function() {
    const usuario = document.getElementById('usuario').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;

    if (nuevaContrasena) {
        await update(ref(db, `usuarios/${usuario}`), {
            contrasena: nuevaContrasena
        });
        mostrarModal("Contraseña actualizada exitosamente.");
    } else {
        mostrarModal("Por favor, ingrese una nueva contraseña.");
    }
};

// Función para abrir el modal de propuesta
window.abrirModalPropuesta = function() {
    document.getElementById('modalPropuesta').style.display = 'block';
};

// Función para cerrar el modal de propuesta
window.cerrarModalPropuesta = function() {
    document.getElementById('modalPropuesta').style.display = 'none';
};

// Función para enviar una propuesta de votación
window.enviarPropuesta = async function() {
    const propuesta = document.getElementById('propuestaVotacion').value;

    if (propuesta) {
        await set(ref(db, `propuestas/${Date.now()}`), {
            propuesta: propuesta,
            usuario: document.getElementById('usuario').value,
            leida: false
        });
        mostrarModal("Propuesta enviada exitosamente.");
        document.getElementById('propuestaVotacion').value = '';
        document.getElementById('notificacionNueva').style.display = 'block'; // Mostrar notificación
        cerrarModalPropuesta(); // Cerrar el modal después de enviar la propuesta
    } else {
        mostrarModal("Por favor, ingrese una propuesta de votación.");
    }
};

// Función para mostrar el cuadro de diálogo de login para el administrador
window.mostrarLoginAdmin = function() {
    document.getElementById('modalLoginAdmin').style.display = 'block';
};

// Función para cerrar el cuadro de diálogo de login para el administrador
window.cerrarModalLoginAdmin = function() {
    document.getElementById('modalLoginAdmin').style.display = 'none';
};

// Función para login de administrador y mostrar notificaciones
window.loginAdminNotificaciones = async function() {
    const usuario = document.getElementById('adminUsuario').value;
    const contrasena = document.getElementById('adminContrasena').value;

    const dbRef = ref(db);
    const adminSnapshot = await get(child(dbRef, 'admin'));

    if (adminSnapshot.exists() && adminSnapshot.val().user === usuario && adminSnapshot.val().contrasena === contrasena) {
        document.getElementById('modalLoginAdmin').style.display = 'none';
        verNotificaciones();
    } else {
        mostrarModal("Usuario o contraseña incorrectos.");
    }
};


// Función para ver notificaciones (solo para admin)
window.verNotificaciones = async function() {
    const dbRef = ref(db);
    const propuestasSnapshot = await get(child(dbRef, 'propuestas'));
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    const listaPropuestas = document.getElementById('listaPropuestas');
    listaPropuestas.innerHTML = '';

    propuestasSnapshot.forEach((childSnapshot) => {
        const propuesta = childSnapshot.val().propuesta;
        const usuario = childSnapshot.val().usuario;
        const leida = childSnapshot.val().leida;
        const estado = childSnapshot.val().estado || 'pendiente';
        const nombreCompleto = usuariosSnapshot.child(usuario).val().nombre;
        const propuestaElement = document.createElement('tr');
        propuestaElement.setAttribute('data-id', childSnapshot.key);
        propuestaElement.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">${nombreCompleto}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${propuesta}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                ${estado === 'pendiente' ? `
                    <button style="background-color: blue; color: white; padding: 5px 8px; border: none; cursor: pointer;" onclick="aprobarPropuesta('${childSnapshot.key}', '${propuesta}', '${nombreCompleto}')">Aprobar</button>
                    <button style="background-color: red; color: white; padding: 5px 8px; border: none; cursor: pointer;" onclick="denegarPropuesta('${childSnapshot.key}')">Denegar</button>
                ` : estado.charAt(0).toUpperCase() + estado.slice(1)}
            </td>
        `;
        if (!leida) {
            propuestaElement.style.backgroundColor = 'green';
            propuestaElement.style.color = 'white';
        }
        listaPropuestas.appendChild(propuestaElement);
    });

    document.getElementById('modalPropuestas').style.display = 'block'; // Mostrar modal de propuestas
};

// Función para aprobar una propuesta
window.aprobarPropuesta = async function(propuestaId, propuesta, nombreCompleto) {
    await update(ref(db, `propuestas/${propuestaId}`), { estado: 'aprobada', leida: true });
    localStorage.setItem('mensajeAprobacion', `Usted aprobó la propuesta "${propuesta}" del usuario ${nombreCompleto}. Ahora cree la votación.`);
    verificarNotificaciones(); // Verificar notificaciones después de aprobar
    location.href = 'crear_votacion.html';
};

// Función para mostrar el mensaje de aprobación de la propuesta en crear_votacion.html
window.addEventListener('load', function() {
    const mensajeAprobacion = localStorage.getItem('mensajeAprobacion');
    if (mensajeAprobacion) {
        document.getElementById('mensajeAprobacion').innerHTML = mensajeAprobacion;
        document.getElementById('mensajeAprobacion').style.display = 'block';
        document.getElementById('votacionActual').style.display = 'none';
        localStorage.removeItem('mensajeAprobacion');
    }
});

// Función para denegar una propuesta
window.denegarPropuesta = async function(propuestaId) {
    await update(ref(db, `propuestas/${propuestaId}`), { estado: 'denegada' });
    mostrarModal("Propuesta denegada.");
    actualizarPropuestaEnTabla(propuestaId, 'denegada');
};


// Función para actualizar la propuesta en la tabla
function actualizarPropuestaEnTabla(propuestaId, estado) {
    const fila = document.querySelector(`tr[data-id="${propuestaId}"]`);
    if (fila) {
        const accionesCelda = fila.querySelector('td:last-child');
        accionesCelda.innerHTML = estado.charAt(0).toUpperCase() + estado.slice(1);
        fila.style.backgroundColor = ''; // Quitar el fondo verde
        fila.style.color = ''; // Quitar el color blanco
    }
}

// Función para verificar notificaciones al cargar la página
window.verificarNotificaciones = async function() {
    const dbRef = ref(db);
    const propuestasSnapshot = await get(child(dbRef, 'propuestas'));

    let hayNotificaciones = false;
    propuestasSnapshot.forEach((childSnapshot) => {
        if (!childSnapshot.val().leida) {
            hayNotificaciones = true;
        }
    });

    const notificacionNueva = document.getElementById('notificacionNueva');
    if (notificacionNueva) { // Verificar si el elemento existe
        if (hayNotificaciones) {
            notificacionNueva.style.display = 'block'; // Mostrar notificación
        } else {
            notificacionNueva.style.display = 'none'; // Ocultar notificación
        }
    }
};

// Función para borrar notificaciones
window.borrarNotificaciones = async function() {
    const dbRef = ref(db);
    const propuestasSnapshot = await get(child(dbRef, 'propuestas'));

    propuestasSnapshot.forEach((childSnapshot) => {
        remove(ref(db, `propuestas/${childSnapshot.key}`));
    });

    mostrarModal("Todas las notificaciones han sido borradas.");
    document.getElementById('notificacionNueva').style.display = 'none'; // Ocultar notificación
};

// Llamar a la función para verificar notificaciones al cargar la página
window.addEventListener('load', verificarNotificaciones);


// Función para cerrar el modal de propuestas y marcar como leídas
window.cerrarModalPropuestas = async function() {
    const dbRef = ref(db);
    const propuestasSnapshot = await get(child(dbRef, 'propuestas'));

    propuestasSnapshot.forEach((childSnapshot) => {
        if (!childSnapshot.val().leida) {
            update(ref(db, `propuestas/${childSnapshot.key}`), { leida: true });
        }
    });

    document.getElementById('modalPropuestas').style.display = 'none';
    document.getElementById('notificacionNueva').style.display = 'none'; // Ocultar notificación
};

// Función para mostrar las propuestas del usuario
window.mostrarMisPropuestas = async function() {
    const usuario = document.getElementById('usuario').value;
    const dbRef = ref(db);
    const propuestasSnapshot = await get(child(dbRef, 'propuestas'));
    const listaMisPropuestas = document.getElementById('listaMisPropuestas');
    listaMisPropuestas.innerHTML = '';

    propuestasSnapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().usuario === usuario) {
            const propuesta = childSnapshot.val().propuesta;
            const estado = childSnapshot.val().estado;
            const propuestaElement = document.createElement('tr');
            propuestaElement.innerHTML = `
                <td style="border: 1px solid #ddd; padding: 8px;">${propuesta}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${estado}</td>
            `;
            listaMisPropuestas.appendChild(propuestaElement);
        }
    });

    document.getElementById('modalMisPropuestas').style.display = 'block'; // Mostrar modal de propuestas del usuario
};

// Función para cerrar el modal de propuestas del usuario
window.cerrarModalMisPropuestas = function() {
    document.getElementById('modalMisPropuestas').style.display = 'none';
};
// Función para mostrar propuestas aprobadas
window.mostrarPropuestasAprobadas = async function() {
    const dbRef = ref(db);
    const propuestasSnapshot = await get(child(dbRef, 'propuestas'));
    const usuariosSnapshot = await get(child(dbRef, 'usuarios'));
    const listaPropuestasAprobadas = document.getElementById('listaPropuestasAprobadas');
    listaPropuestasAprobadas.innerHTML = '';

    propuestasSnapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().estado === 'aprobada') {
            const propuesta = childSnapshot.val().propuesta;
            const usuario = childSnapshot.val().usuario;
            const nombreCompleto = usuariosSnapshot.child(usuario).val().nombre;
            const propuestaElement = document.createElement('tr');
            propuestaElement.innerHTML = `
                <td style="border: 1px solid #ddd; padding: 8px;">${nombreCompleto}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${propuesta}</td>
            `;
            listaPropuestasAprobadas.appendChild(propuestaElement);
        }
    });

    document.getElementById('modalPropuestasAprobadas').style.display = 'block'; // Mostrar modal de propuestas aprobadas
};

// Función para cerrar el modal de propuestas aprobadas
window.cerrarModalPropuestasAprobadas = function() {
    document.getElementById('modalPropuestasAprobadas').style.display = 'none';
};

document.addEventListener('DOMContentLoaded', function() {
      // Función para login de usuario en votacion.html
      window.loginUsuario = async function() {
        const usuario = document.getElementById('usuario').value;
        const contrasena = document.getElementById('contrasena').value;

        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `usuarios/${usuario}`));
        const votacionSnapshot = await get(child(dbRef, 'votacion/dequetrata'));

        if (snapshot.exists() && snapshot.val().contrasena === contrasena) {
            if (votacionSnapshot.exists() && votacionSnapshot.val().codigousado) {
                mostrarModal("Lo siento, la votación ha terminado con la visualización de los resultados.");
                document.getElementById('login').style.display = 'none';
                document.getElementById('votacionTerminada').style.display = 'block';
                return;
            }

            if (snapshot.val().havotado) {
                mostrarModal("Usted ya ha votado.");
                return; // No redirigir automáticamente
            } else {
                document.getElementById('login').style.display = 'none';
                document.getElementById('votacion').style.display = 'block';
                document.getElementById('mensajeBienvenida').innerHTML = `Hola, <span class="nombre">${snapshot.val().nombre}</span>, realiza tu voto...`;
                if (votacionSnapshot.exists() && votacionSnapshot.val().titulo !== "No hay datos") {
                    document.getElementById('titulo').innerText = votacionSnapshot.val().titulo;
                    document.getElementById('descripcion').innerText = votacionSnapshot.val().subtitulo;
                } else {
                    mostrarModal("Lo siento, no hay votación actualmente.");
                    location.href = 'index.html';
                }
            }
        } else {
            mostrarModal("Usuario o contraseña incorrectos.");
        }
    };
});
