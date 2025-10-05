require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const companiesRouter = require('./routes/companies');
const clientsRouter = require('./routes/clients');
const quotationsRouter = require("./routes/quotations");
const notesRouter = require("./routes/notes"); // 🟢 rutas de notas

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cotizador_db';

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => {
    console.error('Error conectando MongoDB:', err);
    process.exit(1);
  });

// Rutas
app.use('/api/companies', companiesRouter);
app.use('/api/clients', clientsRouter); 
app.use("/api/quotations", quotationsRouter);
app.use("/api/notes", notesRouter); // 🟢 CRUD notas

app.get('/', (req, res) => res.json({ ok: true, message: 'Cotizador backend activo' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
