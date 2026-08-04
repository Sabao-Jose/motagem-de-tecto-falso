/**
 * Upload direto do browser ao Vercel Blob Storage.
 *
 * Contorna o limite de ~4.5MB de body das serverless functions do plano
 * Hobby da Vercel: o ficheiro nunca passa pelo servidor, vai direto do
 * browser para o armazenamento Blob usando um client token assinado pelo
 * servidor (rota /api/blob/token).
 *
 * Apenas usado em produção (Vercel). Em desenvolvimento local o fluxo
 * antigo (multer -> disco) continua a ser usado.
 */

// URL do control plane do Vercel Blob (o mesmo que o SDK usa)
const BLOB_API_URL = 'https://vercel.com/api/blob';
// Versão da API Blob usada pelo SDK @vercel/blob instalado
const BLOB_API_VERSION = '12';

// Guarda o resultado da verificação (só consulta o health uma vez por sessão)
let _disponivel = null;

/**
 * Verifica se o upload direto ao Blob está disponível (produção com
 * BLOB_READ_WRITE_TOKEN configurado). Em desenvolvimento local devolve
 * false para que o fluxo antigo (multer -> disco) continue a funcionar.
 * @returns {Promise<boolean>}
 */
export async function isDirectUploadAvailable() {
    if (_disponivel !== null) return _disponivel;
    try {
        const res = await fetch('/api/health');
        if (res.ok) {
            const data = await res.json();
            _disponivel = !!(data && data.blob_token);
        } else {
            _disponivel = false;
        }
    } catch {
        _disponivel = false;
    }
    return _disponivel;
}

/**
 * Envia um ficheiro direto ao Vercel Blob Storage.
 * @param {File} file - Ficheiro selecionado pelo utilizador
 * @param {string} [folder] - Subpasta no Blob (ex.: 'portfolio')
 * @param {Function} [onProgress] - Callback com percentual (0-100) do envio
 * @returns {Promise<string>} URL pública do ficheiro
 */
export async function uploadFileToBlob(file, folder = 'portfolio', onProgress = null) {
    const token = localStorage.getItem('teto_falso_token');

    // 1. Pedir client token ao nosso servidor (identifica o ficheiro e as permissões)
    const res = await fetch('/api/blob/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ originalname: file.name, folder })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Não foi possível iniciar o upload direto');
    }

    const { clientToken, pathname } = data;
    if (!clientToken || !pathname) {
        throw new Error('Resposta inválida ao preparar o upload direto');
    }

    // 2. Enviar o ficheiro diretamente ao Vercel Blob (mesmo protocolo do SDK
    //    @vercel/blob/client). Usa XMLHttpRequest para reportar o progresso
    //    (o fetch não expõe progresso de upload).
    const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${BLOB_API_URL}/?pathname=${encodeURIComponent(pathname)}`);
        xhr.setRequestHeader('authorization', `Bearer ${clientToken}`);
        xhr.setRequestHeader('x-vercel-blob-access', 'public');
        xhr.setRequestHeader('x-api-version', BLOB_API_VERSION);
        xhr.setRequestHeader('x-content-type', file.type || 'application/octet-stream');
        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            };
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                let parsed = null;
                try { parsed = JSON.parse(xhr.responseText); } catch { /* resposta não-JSON */ }
                resolve(parsed);
            } else {
                let msg = 'Erro ao enviar o ficheiro para o armazenamento';
                try {
                    const errData = JSON.parse(xhr.responseText);
                    if (errData && errData.error) {
                        msg = (errData.error.message || errData.error);
                    }
                } catch { /* sem detalhes */ }
                reject(new Error(msg));
            }
        };
        xhr.onerror = () => reject(new Error('Erro de rede ao enviar o ficheiro'));
        xhr.send(file);
    });

    if (!blob || !blob.url) {
        throw new Error('O armazenamento não devolveu a URL do ficheiro');
    }
    return blob.url;
}
