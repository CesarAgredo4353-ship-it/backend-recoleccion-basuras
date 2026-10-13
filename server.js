// ---------------------------------------------------------------
// Backend - App de avisos de recolección de basuras por sector
// ---------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Valores por defecto si el archivo db.json está vacío
db.defaults({ sectores: [], avisos: [], nextSectorId: 1, nextAvisoId: 1 }).write();

const app = express();
app.use(cors());
app.use(express.json());

// =================================================================
// SECTORES
// =================================================================

// GET /api/sectores -> lista todos los sectores
app.get('/api/sectores', (req, res) => {
  res.json(db.get('sectores').value());
});

// GET /api/sectores/:id -> un sector específico
app.get('/api/sectores/:id', (req, res) => {
  const sector = db.get('sectores').find({ id: Number(req.params.id) }).value();
  if (!sector) return res.status(404).json({ error: 'Sector no encontrado' });
  res.json(sector);
});

// POST /api/sectores -> crea un sector nuevo
app.post('/api/sectores', (req, res) => {
  const { nombre, zona } = req.body;
  if (!nombre || !zona) {
    return res.status(400).json({ error: 'nombre y zona son obligatorios' });
  }
  const id = db.get('nextSectorId').value();
  const nuevoSector = { id, nombre, zona };
  db.get('sectores').push(nuevoSector).write();
  db.update('nextSectorId', n => n + 1).write();
  res.status(201).json(nuevoSector);
});

// PUT /api/sectores/:id -> actualiza un sector
app.put('/api/sectores/:id', (req, res) => {
  const id = Number(req.params.id);
  const sector = db.get('sectores').find({ id }).value();
  if (!sector) return res.status(404).json({ error: 'Sector no encontrado' });

  const { nombre, zona } = req.body;
  if (!nombre || !zona) {
    return res.status(400).json({ error: 'nombre y zona son obligatorios' });
  }
  db.get('sectores').find({ id }).assign({ nombre, zona }).write();
  res.json(db.get('sectores').find({ id }).value());
});

// DELETE /api/sectores/:id -> elimina un sector
app.delete('/api/sectores/:id', (req, res) => {
  const id = Number(req.params.id);
  const sector = db.get('sectores').find({ id }).value();
  if (!sector) return res.status(404).json({ error: 'Sector no encontrado' });
  db.get('sectores').remove({ id }).write();
  res.status(204).send();
});

// =================================================================
// AVISOS (entidad principal, con CRUD completo)
// =================================================================

// GET /api/avisos  y  GET /api/avisos?sector=ID -> lista (con filtro opcional)
app.get('/api/avisos', (req, res) => {
  const { sector } = req.query;
  let avisos = db.get('avisos').value();
  if (sector) {
    avisos = avisos.filter(a => a.sectorId === Number(sector));
  }
  res.json(avisos);
});

// GET /api/avisos/:id -> un aviso específico
app.get('/api/avisos/:id', (req, res) => {
  const aviso = db.get('avisos').find({ id: Number(req.params.id) }).value();
  if (!aviso) return res.status(404).json({ error: 'Aviso no encontrado' });
  res.json(aviso);
});

// POST /api/avisos -> crea un aviso nuevo (aplica la regla de negocio)
app.post('/api/avisos', (req, res) => {
  const { sectorId, hora } = req.body;
  if (!sectorId || !hora) {
    return res.status(400).json({ error: 'sectorId y hora son obligatorios' });
  }

  const sector = db.get('sectores').find({ id: Number(sectorId) }).value();
  if (!sector) {
    return res.status(404).json({ error: 'El sector indicado no existe' });
  }

  // REGLA DE NEGOCIO: no permitir un aviso activo si ya existe
  // uno activo para ese mismo sector (evita notificaciones duplicadas).
  const avisoActivoExistente = db.get('avisos')
    .find({ sectorId: Number(sectorId), estado: 'activo' })
    .value();
  if (avisoActivoExistente) {
    return res.status(409).json({ error: 'Ya existe un aviso activo para este sector' });
  }

  const id = db.get('nextAvisoId').value();
  const nuevoAviso = { id, sectorId: Number(sectorId), hora, estado: 'activo' };
  db.get('avisos').push(nuevoAviso).write();
  db.update('nextAvisoId', n => n + 1).write();
  res.status(201).json(nuevoAviso);
});

// PUT /api/avisos/:id -> actualiza la hora de un aviso
app.put('/api/avisos/:id', (req, res) => {
  const id = Number(req.params.id);
  const aviso = db.get('avisos').find({ id }).value();
  if (!aviso) return res.status(404).json({ error: 'Aviso no encontrado' });

  const { hora } = req.body;
  if (!hora) return res.status(400).json({ error: 'hora es obligatoria' });

  db.get('avisos').find({ id }).assign({ hora }).write();
  res.json(db.get('avisos').find({ id }).value());
});

// PATCH /api/avisos/:id/desactivar -> marca el aviso como cumplido
app.patch('/api/avisos/:id/desactivar', (req, res) => {
  const id = Number(req.params.id);
  const aviso = db.get('avisos').find({ id }).value();
  if (!aviso) return res.status(404).json({ error: 'Aviso no encontrado' });

  db.get('avisos').find({ id }).assign({ estado: 'inactivo' }).write();
  res.json(db.get('avisos').find({ id }).value());
});

// DELETE /api/avisos/:id -> elimina un aviso
app.delete('/api/avisos/:id', (req, res) => {
  const id = Number(req.params.id);
  const aviso = db.get('avisos').find({ id }).value();
  if (!aviso) return res.status(404).json({ error: 'Aviso no encontrado' });
  db.get('avisos').remove({ id }).write();
  res.status(204).send();
});

// =================================================================
// Manejo de errores generales (por si algo truena inesperadamente)
// =================================================================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
