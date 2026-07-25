/**
 * Database Adapter - Suporta SQLite (local) e PostgreSQL (Vercel)
 * 
 * Detecta automaticamente o ambiente:
 * - Local: usa SQLite (database.db)
 * - Vercel: usa PostgreSQL via @vercel/postgres
 */

const path = require('path');
const bcrypt = require('bcryptjs');

// Detectar se está no Vercel (tem POSTGRES_URL ou DATABASE_URL)
const isVercel = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

let db;

if (isVercel) {
  console.log('🔗 Modo Vercel: usando PostgreSQL');
  db = require('./database-postgres');
} else {
  console.log('💾 Modo Local: usando SQLite');
  db = require('./database-sqlite');
}

module.exports = db;
