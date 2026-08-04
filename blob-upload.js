/**
 * Vercel Blob Upload Helper
 * 
 * Gerencia uploads e delete de ficheiros:
 * - Vercel: usa @vercel/blob (persistente)
 * - Local: usa disco (pasta uploads/)
 */

const { put, del } = require('@vercel/blob');
const { generateClientTokenFromReadWriteToken } = require('@vercel/blob/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const isVercel = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
const LOCAL_UPLOAD_DIR = path.join(__dirname, 'uploads');

// Limite para upload direto do browser ao Blob (fica longe do limite de 4.5MB do serverless)
const MAX_DIRECT_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB

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

/**
 * Gera um client token para upload DIRETO do browser ao Vercel Blob.
 * Contorna o limite de ~4.5MB de body das serverless functions do Vercel Hobby:
 * o ficheiro vai do browser para o Blob sem passar pelo servidor.
 *
 * @param {string} originalname - Nome original do ficheiro
 * @param {string} [folder] - Subpasta (ex.: 'portfolio')
 * @returns {Promise<{clientToken: string, pathname: string, filename: string}>}
 */
async function getClientUploadToken(originalname, folder = '') {
    if (!isVercel) {
        throw new Error('Upload direto só está disponível no Vercel');
    }
    const filename = generateFilename(originalname);
    const pathname = folder ? `${folder}/${filename}` : filename;

    const clientToken = await generateClientTokenFromReadWriteToken({
        pathname,
        // Mesmos tipos aceites pelo multer (server.js)
        allowedContentTypes: ['image/*', 'video/*', 'application/pdf'],
        maximumSizeInBytes: MAX_DIRECT_UPLOAD_BYTES,
        addRandomSuffix: false,
        allowOverwrite: false,
        // Token válido por 1 hora (uploads de vídeo podem demorar)
        validUntil: Date.now() + 60 * 60 * 1000
    });

    return { clientToken, pathname, filename };
}

module.exports = { uploadFile, deleteFile, isVercel, getClientUploadToken };
