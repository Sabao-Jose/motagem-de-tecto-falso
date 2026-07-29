/**
 * Vercel Blob Upload Helper
 * 
 * Gerencia uploads e delete de ficheiros:
 * - Vercel: usa @vercel/blob (persistente)
 * - Local: usa disco (pasta uploads/)
 */

const { put, del } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const isVercel = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
const LOCAL_UPLOAD_DIR = path.join(__dirname, 'uploads');

// Garantir que a pasta local existe
if (!isVercel && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

/**
 * Gera nome único para o ficheiro
 */
function generateFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const unique = crypto.randomBytes(16).toString('hex');
  return `${unique}${ext}`;
}

/**
 * Faz upload de um ficheiro
 * @param {Buffer} fileBuffer - Conteúdo do ficheiro
 * @param {string} originalname - Nome original do ficheiro
 * @param {string} [folder] - Subpasta (opcional)
 * @returns {Promise<{url: string, filename: string}>}
 */
async function uploadFile(fileBuffer, originalname, folder = '') {
  const filename = generateFilename(originalname);

  if (isVercel) {
    // Vercel: upload para Blob Storage
    const pathname = folder ? `${folder}/${filename}` : filename;
    const blob = await put(pathname, fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    return { url: blob.url, filename };
  } else {
    // Local: salvar no disco
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, fileBuffer);
    const url = `/uploads/${filename}`;
    return { url, filename };
  }
}

/**
 * Remove um ficheiro
 * @param {string} url - URL do ficheiro (Blob URL ou /uploads/...)
 */
async function deleteFile(url) {
  if (!url) return;

  if (isVercel) {
    // Vercel: remover do Blob Storage
    try {
      await del(url);
    } catch (err) {
      // Se falhar, pode ser porque o ficheiro já não existe
      console.warn('Aviso ao apagar blob:', err.message);
    }
  } else {
    // Local: remover do disco
    const filename = path.basename(url);
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = { uploadFile, deleteFile, isVercel };
