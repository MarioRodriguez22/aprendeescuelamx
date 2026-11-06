import { useEffect, useState } from 'react';
import Inicio from './pages/Inicio.jsx';
import SubirFotos from './pages/SubirFotos.jsx';
import ConfigurarExamen from './pages/ConfigurarExamen.jsx';
import Examen from './pages/Examen.jsx';
import Resultados from './pages/Resultados.jsx';
import Acceso from './pages/Acceso.jsx';
import PanelAdmin from './pages/PanelAdmin.jsx';
import { api } from './services/api.js';

const estilos = `
:root{font-family:Arial,sans-serif;color:#3c3028;background:#fff8ed;font-size:18px;font-synthesis:none}
*{box-sizing:border-box}body{margin:0;min-width:320px}button,input,select,textarea{font:inherit}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #347a49;outline-offset:3px}
#root{min-height:100vh}.pantalla{width:min(100% - 32px,720px);margin:0 auto;padding:24px 0 48px}
.centrado{text-align:center;padding-top:12vh}.marca{font-size:4rem}h1{font-size:clamp(2rem,7vw,3rem);line-height:1.12;color:#7a3e18;margin:18px 0}
p{line-height:1.55}.boton{display:block;width:100%;border:0;border-radius:16px;padding:16px 20px;margin:14px 0;font-weight:700;cursor:pointer}
.boton:disabled{opacity:.6;cursor:wait}.principal{background:#f29a38;color:#fff}.secundario{background:#ffe5c4;color:#61391d}
.enlace{border:0;background:none;color:#934d20;padding:8px 0;cursor:pointer}.formulario{display:grid;gap:18px;margin-top:24px}
.formulario label{display:grid;gap:8px;font-weight:700}.formulario select,.pregunta textarea{width:100%;padding:14px;border:2px solid #efcfaa;border-radius:12px;background:white}
.selector-fotos{display:block;border:2px dashed #e2a565;background:#fff0dc;border-radius:16px;padding:28px;text-align:center;font-weight:bold}
.selector-fotos input{display:block;width:100%;margin-top:16px}.error{color:#a12720;background:#ffe5e2;padding:12px;border-radius:10px}
.tarjeta{background:#fff;border-radius:16px;padding:20px;margin:18px 0;box-shadow:0 3px 12px #50331412}.pregunta h2{font-size:1.2rem;line-height:1.45}
.opciones{display:grid;gap:10px}.opcion{display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:#fff5e8}
.opcion input{width:22px;height:22px;accent-color:#e88427}.progreso{height:30px;background:#f3dec7;border-radius:20px;position:relative;overflow:hidden;text-align:center;margin:20px 0}
.progreso-relleno{height:100%;background:#a9d8a3;transition:width .2s}.progreso span{position:absolute;inset:4px;font-size:.85rem;font-weight:bold}
.cabecera-examen{display:flex;align-items:center;justify-content:space-between;gap:12px}.cabecera-examen h1{font-size:1.7rem;margin-bottom:4px}.cabecera-examen p{margin-top:0}
.temporizador{white-space:nowrap;background:#ffe5c4;padding:12px;border-radius:12px}.calificacion{font-size:5rem;font-weight:bold;color:#e47c20;margin:10px}
.calificacion small{font-size:1.2rem}.resultado-principal{padding-top:2vh}.revision h3{margin-top:0}.acierto{border-left:6px solid #64a85f}.error-respuesta{border-left:6px solid #de775c}
.seleccion-fotos,.fotos-del-dia{margin:24px 0}.seleccion-fotos ul,.grupo-materia ul{padding-left:22px;line-height:1.7;overflow-wrap:anywhere}
.selector-camara{display:block;text-align:center;padding:15px;margin-top:12px;border:2px solid #efcfaa;border-radius:14px;background:#fff;font-weight:bold;color:#61391d}
.selector-camara input{display:block;width:100%;margin-top:12px}
.campo-materia{display:grid;gap:8px;margin:18px 0;font-weight:bold}
.campo-materia input{width:100%;padding:14px;border:2px solid #efcfaa;border-radius:12px;background:white}
.campo-materia span{font-size:.86rem;font-weight:normal;color:#705b49}
.materia-seleccionada{background:#e8f3e5;border-radius:12px;padding:14px;color:#2e6038}
.progreso-subida{height:12px;overflow:hidden;border-radius:10px;background:#f3dec7}
.progreso-subida div{height:100%;background:#79b978;transition:width .2s}
.previsualizaciones-fotos{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px}
.previsualizacion-foto{display:grid;align-content:start;gap:7px;min-width:0;background:#fff;border-radius:12px;padding:8px;box-shadow:0 2px 8px #50331412}
.previsualizacion-foto img{width:100%;height:100px;object-fit:cover;border-radius:8px;background:#f3dec7}
.previsualizacion-foto span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82rem}
.previsualizacion-foto .estado-foto{white-space:normal;font-weight:bold}
.estado-pendiente{color:#75552f}.estado-preparando,.estado-subiendo{color:#875d0a}.estado-lista{color:#28703a}.estado-error,.error-foto{color:#a12720}
.previsualizacion-foto .error-foto{white-space:normal;font-size:.76rem}
.descripcion-visual{margin:8px 0;font-size:.9rem}.descripcion-visual summary{cursor:pointer;color:#2e6038;font-weight:bold}
.descripcion-visual p{margin:6px 0;white-space:normal}
.quitar-foto{border:0;border-radius:8px;padding:8px;background:#ffe5e2;color:#8f2f25;font-weight:bold}
.grupo-materia{background:#fff;border:1px solid #f0dcc3;border-radius:16px;padding:18px;margin:14px 0}
.grupo-materia h3{color:#7a3e18;margin:0 0 8px}.grupo-materia h3 span{color:#795b43;font-size:.9rem}
.materia-grupo{border-top:1px solid #f0dcc3;padding-top:8px}.boton-grupo{background:#e8f3e5;color:#2e6038}.materia-manual{display:grid;gap:8px}.materia-manual label{display:grid;gap:8px;font-weight:bold}
.materia-manual select{padding:12px;border:2px solid #efcfaa;border-radius:12px;background:white}.texto-no-leido{color:#8a5a32}
.nota-privacidad{font-size:.88rem;color:#705b49;background:#fff0dc;border-radius:10px;padding:12px}
.formulario-acceso{max-width:520px;margin:24px auto;text-align:left}
.formulario-acceso input{width:100%;padding:14px;border:2px solid #efcfaa;border-radius:12px;background:white}
.sesion-activa{width:min(100% - 32px,720px);margin:12px auto 0;display:flex;justify-content:space-between;align-items:center;gap:12px;color:#705b49;font-size:.9rem}
.sesion-activa button{border:0;background:#ffe5c4;color:#61391d;border-radius:10px;padding:9px 12px;font-weight:bold}
.foto-guardada{min-width:0;background:#fff;border-radius:12px;padding:8px;box-shadow:0 2px 8px #50331412}
.foto-guardada img,.foto-sin-archivo{display:grid;width:100%;height:150px;object-fit:cover;border-radius:8px;background:#f3dec7}
.foto-sin-archivo{place-items:center;padding:12px;text-align:center;color:#705b49;font-size:.82rem}
.foto-guardada strong{display:block;overflow-wrap:anywhere;margin-top:8px}
.foto-guardada p{font-size:.85rem;margin:6px 0}
.texto-foto-guardada{max-height:150px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}
.acciones-sesion{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.acciones-sesion button{border:0;background:#ffe5c4;color:#61391d;border-radius:10px;padding:9px 12px;font-weight:bold}
.tabla-usuarios{overflow-x:auto}
.tabla-usuarios table{width:100%;border-collapse:collapse;text-align:left}
.tabla-usuarios th,.tabla-usuarios td{padding:12px 8px;border-bottom:1px solid #f0dcc3}
.tabla-usuarios th{color:#7a3e18}
@media(min-width:600px){.pantalla{padding-top:36px}.centrado{padding-top:14vh}.resultado-principal{padding-top:2vh}}
`;

const rutas = {
  inicio: '/',
  subir: '/subir-fotos',
  configurar: '/configurar-examen',
  examen: '/examen',
  resultados: '/resultados',
  admin: '/admin'
};

function pantallaDesdeRuta() {
  return Object.entries(rutas).find(([, ruta]) => ruta === window.location.pathname)?.[0] || 'inicio';
}

export default function App() {
  const [pantalla, setPantalla] = useState(pantallaDesdeRuta);
  const [texto, setTexto] = useState('');
  const [materiaInicial, setMateriaInicial] = useState('');
  const [examen, setExamen] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [errorSesion, setErrorSesion] = useState('');

  useEffect(() => {
    let activa = true;
    api.usuarioActual()
      .then(({ usuario: actual }) => {
        if (activa) setUsuario(actual);
      })
      .catch((error) => {
        if (activa) setErrorSesion(error.message);
      })
      .finally(() => {
        if (activa) setCargandoSesion(false);
      });
    return () => { activa = false; };
  }, []);

  useEffect(() => {
    function sincronizarRuta() {
      setPantalla(pantallaDesdeRuta());
    }
    window.addEventListener('popstate', sincronizarRuta);
    return () => window.removeEventListener('popstate', sincronizarRuta);
  }, []);

  function ir(destino) {
    if (destino === 'inicio') {
      setExamen(null);
      setResultado(null);
      setTexto('');
      setMateriaInicial('');
    }
    if (rutas[destino] && window.location.pathname !== rutas[destino]) {
      window.history.pushState({}, '', rutas[destino]);
    }
    setPantalla(destino);
  }

  async function salir() {
    try {
      await api.cerrarSesion();
      setUsuario(null);
      setErrorSesion('');
      setExamen(null);
      setResultado(null);
      setTexto('');
      setMateriaInicial('');
    } catch (error) {
      setErrorSesion(error.message);
    }
  }

  return (
    <>
      <style>{estilos}</style>
      {cargandoSesion && <main className="pantalla centrado"><p>Revisando tu cuenta…</p></main>}
      {!cargandoSesion && !usuario && (
        <Acceso alAutenticar={(actual) => {
          setUsuario(actual);
          setErrorSesion('');
        }} errorServidor={errorSesion} />
      )}
      {!cargandoSesion && usuario && (
        <>
          <div className="sesion-activa">
            <span>Cuenta: <strong>{usuario.nombreUsuario}</strong></span>
            <div className="acciones-sesion">
              {usuario.rol === 'admin' && (
                <button type="button" onClick={() => ir('admin')}>
                  Panel de administración
                </button>
              )}
              <button type="button" onClick={salir}>Cerrar sesión</button>
            </div>
          </div>
          {errorSesion && <p className="error" role="alert">{errorSesion}</p>}
          {pantalla === 'admin' && usuario.rol === 'admin'
            ? <PanelAdmin alVolver={() => ir('inicio')} />
            : pantalla === 'admin'
              ? <main className="pantalla"><h1>Acceso restringido</h1><p>El panel de administración solo está disponible para administradores.</p></main>
              : <>
                {pantalla === 'inicio' && <Inicio ir={ir} />}
                {pantalla === 'subir' && <SubirFotos alSeleccionar={(contenido, materia) => {
                  setTexto(contenido);
                  setMateriaInicial(materia);
                }} ir={ir} />}
                {pantalla === 'configurar' && <ConfigurarExamen texto={texto} materiaInicial={materiaInicial} alCrear={setExamen} ir={ir} />}
                {pantalla === 'examen' && examen && <Examen examen={examen} alTerminar={setResultado} ir={ir} />}
                {pantalla === 'resultados' && <Resultados resultado={resultado} ir={ir} />}
              </>}
        </>
      )}
    </>
  );
}
