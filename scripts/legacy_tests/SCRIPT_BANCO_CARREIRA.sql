-- CRIAÇÃO DAS TABELAS PARA O MÓDULO DE CARREIRA
-- Execute este script no seu MySQL Workbench.

-- 1. Criação da tabela sem a chave estrangeira (para evitar o erro 150 inicial)
CREATE TABLE IF NOT EXISTS career_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- IMPORTANTE: Verifique o tipo do ID na sua tabela 'students'. 
    -- Se for UUID, mude para VARCHAR(36). Se for INT, mantenha INT.
    student_id INT NOT NULL, 
    title VARCHAR(255) NULL,
    bio TEXT NULL,
    linkedin_url VARCHAR(255) NULL,
    github_url VARCHAR(255) NULL,
    portfolio_url VARCHAR(255) NULL,
    resume_url VARCHAR(500) NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT FALSE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabela de Habilidades
CREATE TABLE IF NOT EXISTS career_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    career_profile_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_skill_profile FOREIGN KEY (career_profile_id) REFERENCES career_profiles(id) ON DELETE CASCADE
);

-- 3. TENTATIVA DE CRIAÇÃO DA CHAVE ESTRANGEIRA (Execute uma das opções abaixo)

-- OPÇÃO A: Se o seu id em 'students' for INT normal
-- ALTER TABLE career_profiles ADD CONSTRAINT fk_career_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- OPÇÃO B: Se o seu id em 'students' for INT UNSIGNED (Comum em Laravel/Frameworks)
-- Primeiro ajuste a coluna: 
-- ALTER TABLE career_profiles MODIFY COLUMN student_id INT UNSIGNED NOT NULL;
-- Depois crie a chave:
-- ALTER TABLE career_profiles ADD CONSTRAINT fk_career_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- OPÇÃO C: Se o seu id em 'students' for UUID / VARCHAR
-- Primeiro ajuste a coluna:
-- ALTER TABLE career_profiles MODIFY COLUMN student_id VARCHAR(36) NOT NULL;
-- Depois crie a chave:
-- ALTER TABLE career_profiles ADD CONSTRAINT fk_career_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
