const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados invalidos',
      details: errors.array().map(e => ({ campo: e.path, mensagem: e.msg }))
    });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail().isLength({ max: 54 }).withMessage('Email deve ter no maximo 54 caracteres'),
  body('senha').notEmpty().withMessage('Senha obrigatoria').isLength({ min: 6, max: 12 }).withMessage('Senha deve ter entre 6 e 12 caracteres'),
  handleValidationErrors,
];

const registerValidation = [
  body('nome').trim().notEmpty().withMessage('Nome obrigatorio').isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail().isLength({ max: 54 }).withMessage('Email deve ter no maximo 54 caracteres'),
  body('senha').isLength({ min: 6, max: 12 }).withMessage('Senha deve ter entre 6 e 12 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter maiuscula, minuscula e numero'),
  body('telefone').optional().trim().customSanitizer(v => v ? v.replace(/[^0-9]/g, '') : v).isLength({ max: 9 }).withMessage('Telefone deve ter no maximo 9 digitos'),
  handleValidationErrors,
];

const createUsuarioValidation = [
  body('nome').trim().notEmpty().withMessage('Nome obrigatorio').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail().isLength({ max: 54 }).withMessage('Email deve ter no maximo 54 caracteres'),
  body('senha').isLength({ min: 6, max: 12 }).withMessage('Senha deve ter entre 6 e 12 caracteres'),
  body('role').isIn(['admin', 'funcionario', 'cliente']).withMessage('Role invalida'),
  body('telefone').optional().trim().customSanitizer(v => v ? v.replace(/[^0-9]/g, '') : v).isLength({ max: 9 }).withMessage('Telefone deve ter no maximo 9 digitos'),
  body('salario').optional().isFloat({ min: 0 }).withMessage('Salario invalido'),
  handleValidationErrors,
];

const updateUsuarioValidation = [
  body('nome').trim().notEmpty().withMessage('Nome obrigatorio'),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail().isLength({ max: 54 }).withMessage('Email deve ter no maximo 54 caracteres'),
  body('telefone').optional().trim().customSanitizer(v => v ? v.replace(/[^0-9]/g, '') : v).isLength({ max: 9 }).withMessage('Telefone deve ter no maximo 9 digitos'),
  handleValidationErrors,
];

const servicoValidation = [
  body('cliente_id').optional().isInt().withMessage('Cliente invalido'),
  body('tipo_teto').trim().notEmpty().withMessage('Tipo de teto obrigatorio'),
  body('area').isFloat({ min: 0.1 }).withMessage('Area deve ser maior que 0'),
  body('valor_total').isFloat({ min: 0 }).withMessage('Valor total invalido'),
  handleValidationErrors,
];

const contactValidation = [
  body('nome').trim().notEmpty().withMessage('Nome obrigatorio').isLength({ min: 2, max: 100 }),
  body('telefone').trim().notEmpty().withMessage('Telefone obrigatorio').customSanitizer(v => v.replace(/[^0-9]/g, '')).isLength({ max: 9 }).withMessage('Telefone deve ter no maximo 9 digitos'),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail().isLength({ max: 54 }).withMessage('Email deve ter no maximo 54 caracteres'),
  body('assunto').trim().notEmpty().withMessage('Assunto obrigatorio').isLength({ min: 3, max: 200 }),
  body('mensagem').trim().notEmpty().withMessage('Mensagem obrigatoria').isLength({ min: 10 }).withMessage('Mensagem deve ter no minimo 10 caracteres'),
  handleValidationErrors,
];

const idParamValidation = [
  param('id').isInt().withMessage('ID invalido'),
  handleValidationErrors,
];

const roleValidation = [
  body('role').isIn(['admin', 'funcionario', 'cliente']).withMessage('Role invalida'),
  handleValidationErrors,
];

const updateDadosFuncionarioValidation = [
  body('salario').optional().isFloat({ min: 0 }).withMessage('Salario invalido'),
  body('endereco').optional().trim(),
  body('numero_conta').optional().trim(),
  body('banco').optional().trim(),
  body('tipo_conta').optional().trim(),
  handleValidationErrors,
];

const configValidation = [
  body('valor').notEmpty().withMessage('Valor obrigatorio'),
  handleValidationErrors,
];

const faltaValidation = [
  body('usuario_id').isInt().withMessage('Usuario invalido'),
  body('data').isDate().withMessage('Data invalida'),
  body('observacao').optional().trim(),
  handleValidationErrors,
];

const aiChatValidation = [
  body('mensagem').trim().notEmpty().withMessage('Mensagem obrigatoria').isLength({ min: 1, max: 2000 }).withMessage('Mensagem muito longa (max 2000 caracteres)'),
  handleValidationErrors,
];

module.exports = {
  loginValidation,
  registerValidation,
  createUsuarioValidation,
  updateUsuarioValidation,
  servicoValidation,
  contactValidation,
  idParamValidation,
  roleValidation,
  updateDadosFuncionarioValidation,
  configValidation,
  faltaValidation,
  aiChatValidation,
};
