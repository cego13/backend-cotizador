// scripts/resetPassword.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // ruta relativa desde /backend

require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const email = 'admin@empresa.com';            // <-- cambia si hace falta
  const newPassword = 'NuevaPass123';           // <-- la nueva contraseña que quieras

  const hashed = await bcrypt.hash(newPassword, 10);
  const user = await User.findOneAndUpdate({ email }, { password: hashed }, { new: true });

  if (!user) {
    console.log('Usuario no encontrado');
  } else {
    console.log('Contraseña actualizada para', user.email);
  }

  await mongoose.disconnect();
  process.exit();
}

run().catch(err => { console.error(err); process.exit(1); });
