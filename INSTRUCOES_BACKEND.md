# Implementação do Backend para o Módulo de Carreira

Para que o frontend funcione, você precisa implementar as seguintes rotas na sua API (Backend).

## 1. Configuração do Multer (Upload de Arquivos)

Certifique-se de ter instalado: `npm install multer`

```javascript
// config/multer.js (ou onde você configura uploads)
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Certifique-se que esta pasta existe!
    cb(null, 'uploads/resumes/') 
  },
  filename: function (req, file, cb) {
    // Salva como: 81-timestamp-nomeoriginal.pdf
    cb(null, req.params.studentId + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'));
    }
  }
});

module.exports = upload;
```

## 2. Rotas da API (Career Routes)

Adicione estas rotas no seu arquivo de rotas (ex: `routes/careerRoutes.js`).

```javascript
const express = require('express');
const router = express.Router();
const upload = require('../config/multer'); // Importe a config acima
const db = require('../database'); // Sua conexão MySQL

// GET: Obter perfil
router.get('/:studentId', async (req, res) => {
  try {
    const [profiles] = await db.query(
      'SELECT * FROM career_profiles WHERE student_id = ?', 
      [req.params.studentId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Perfil não encontrado' });
    }

    const profile = profiles[0];

    // Buscar skills
    const [skills] = await db.query(
      'SELECT name FROM career_skills WHERE career_profile_id = ?',
      [profile.id]
    );

    profile.skills = skills.map(s => s.name);
    
    // Converter booleanos (MySQL retorna 0/1)
    profile.is_public = !!profile.is_public;
    profile.is_available = !!profile.is_available;

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Upload de Currículo
router.post('/:studentId/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const studentId = req.params.studentId;
  // URL relativa para acesso ao arquivo
  const fileUrl = `/uploads/resumes/${req.file.filename}`; 

  try {
    // Atualiza ou Cria o perfil com a URL do currículo
    // Verifica se já existe perfil
    const [existing] = await db.query('SELECT id FROM career_profiles WHERE student_id = ?', [studentId]);
    
    if (existing.length > 0) {
      await db.query(
        'UPDATE career_profiles SET resume_url = ? WHERE student_id = ?',
        [fileUrl, studentId]
      );
    } else {
      await db.query(
        'INSERT INTO career_profiles (student_id, resume_url) VALUES (?, ?)',
        [studentId, fileUrl]
      );
    }

    res.json({ url: fileUrl, message: 'Upload realizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Atualizar Perfil
router.put('/:studentId', async (req, res) => {
  const { bio, title, linkedin_url, github_url, portfolio_url, is_public, is_available, skills } = req.body;
  const studentId = req.params.studentId;

  try {
    // Upsert (Insert ou Update) do Perfil
    const [existing] = await db.query('SELECT id FROM career_profiles WHERE student_id = ?', [studentId]);
    let profileId;

    if (existing.length > 0) {
      profileId = existing[0].id;
      await db.query(`
        UPDATE career_profiles SET 
          bio=?, title=?, linkedin_url=?, github_url=?, portfolio_url=?, 
          is_public=?, is_available=?
        WHERE student_id=?`,
        [bio, title, linkedin_url, github_url, portfolio_url, is_public, is_available, studentId]
      );
    } else {
      const [result] = await db.query(`
        INSERT INTO career_profiles 
          (student_id, bio, title, linkedin_url, github_url, portfolio_url, is_public, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, bio, title, linkedin_url, github_url, portfolio_url, is_public, is_available]
      );
      profileId = result.insertId;
    }

    // Atualizar Skills (Remove todas e insere novas - estratégia simples)
    if (skills && Array.isArray(skills)) {
      await db.query('DELETE FROM career_skills WHERE career_profile_id = ?', [profileId]);
      
      if (skills.length > 0) {
        const values = skills.map(skill => [profileId, skill]);
        await db.query('INSERT INTO career_skills (career_profile_id, name) VALUES ?', [values]);
      }
    }

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```
