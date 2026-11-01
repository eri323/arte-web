import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenLocal, type AlmacenamientoClaveValor } from './almacen';
import { crearPedido } from './pedidos';

class MemoriaFalsa implements AlmacenamientoClaveValor {
  datos = new Map<string, string>();
  getItem(clave: string) {
    return this.datos.get(clave) ?? null;
  }
  setItem(clave: string, valor: string) {
    this.datos.set(clave, valor);
  }
}

const AHORA = new Date('2026-11-01T12:00:00.000Z');

describe('crearAlmacenLocal', () => {
  let memoria: MemoriaFalsa;
  beforeEach(() => {
    memoria = new MemoriaFalsa();
  });

  const almacen = () => crearAlmacenLocal(memoria, { ahora: () => AHORA });

  const nuevo = (numero: string) =>
    crearPedido({
      numero,
      cliente: { nombre: 'Ana', ciudad: 'Pereira' },
      items: [],
      total: 60000,
      fecha: AHORA.toISOString(),
    });

  it('la primera vez carga los pedidos demo', async () => {
    const lista = await almacen().listar();
    expect(lista.map((p) => p.numero).sort()).toEqual(['AE-1040', 'AE-1041', 'AE-1042']);
  });

  it('obtiene por número sin importar mayúsculas ni espacios', async () => {
    expect((await almacen().obtener(' ae-1041 '))?.estado).toBe('listo');
    expect(await almacen().obtener('AE-9999')).toBeNull();
  });

  it('guarda un pedido nuevo y lo actualiza sin duplicar', async () => {
    const a = almacen();
    await a.guardar(nuevo('AE-1043'));
    await a.guardar({ ...nuevo('AE-1043'), total: 70000 });
    const lista = await a.listar();
    expect(lista.filter((p) => p.numero === 'AE-1043')).toHaveLength(1);
    expect((await a.obtener('AE-1043'))?.total).toBe(70000);
  });

  it('persiste entre instancias', async () => {
    await almacen().guardar(nuevo('AE-1043'));
    expect(await almacen().obtener('AE-1043')).not.toBeNull();
  });

  it('lista los más nuevos primero', async () => {
    await almacen().guardar(nuevo('AE-1043'));
    expect((await almacen().listar())[0].numero).toBe('AE-1043');
  });

  it('restaurarDemo borra los pedidos del cliente', async () => {
    const a = almacen();
    await a.guardar(nuevo('AE-1043'));
    await a.restaurarDemo();
    expect(await a.obtener('AE-1043')).toBeNull();
    expect(await a.listar()).toHaveLength(3);
  });

  it('si el JSON está dañado vuelve a los datos demo', async () => {
    memoria.setItem('arte-web:pedidos', '{no es json');
    expect(await almacen().listar()).toHaveLength(3);
  });
});
