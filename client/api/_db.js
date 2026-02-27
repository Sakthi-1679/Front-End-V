// api/_db.js – shared JSON file storage in /tmp (persists within a warm Vercel invocation)
// NOTE: /tmp is ephemeral across cold starts. For production, replace with a real database.
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = '/tmp/vkm-data';

function seedAdmin() {
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) {
    const hashed = bcrypt.hashSync('vkm@admin', 10);
    fs.writeFileSync(usersFile, JSON.stringify([{
      id: 'admin-001',
      name: 'VKM Admin',
      email: 'vkmflowerskpm@gmail.com',
      password: hashed,
      phone: '9999999999',
      city: 'Kanchipuram',
      area: 'Main',
      role: 'ADMIN',
    }], null, 2));
  }
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  seedAdmin();
}

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function read(name) {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(filePath(name), 'utf8')); }
  catch { return name === 'settings' ? {} : []; }
}

export function readOne(name) {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(filePath(name), 'utf8')); }
  catch { return {}; }
}

export function write(name, data) {
  ensureDir();
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 5);
}
