-- Create the SmartHive database
CREATE DATABASE IF NOT EXISTS abelhas_nativas;
USE abelhas_nativas;

-- Drop tables if they exist to avoid errors on recreation
DROP TABLE IF EXISTS predator_detections;
DROP TABLE IF EXISTS predator_types;
DROP TABLE IF EXISTS alertas;
DROP TABLE IF EXISTS monitoramento_abelhas;
DROP TABLE IF EXISTS colmeias;
DROP TABLE IF EXISTS apiarios;
DROP TABLE IF EXISTS usuarios;

-- Create usuarios (users) table
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  role ENUM('admin', 'usuario', 'tecnico') DEFAULT 'usuario',
  ultimo_login DATETIME,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create apiarios (apiaries) table
CREATE TABLE apiarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  localizacao VARCHAR(255) NOT NULL,
  responsavel VARCHAR(100),
  descricao TEXT,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create colmeias (hives) table
CREATE TABLE colmeias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  localizacao VARCHAR(255) NOT NULL,
  status ENUM('Ativa', 'Em manutenção', 'Inativa') DEFAULT 'Ativa',
  especie VARCHAR(100),
  data_instalacao DATE,
  apiario_id INT,
  FOREIGN KEY (apiario_id) REFERENCES apiarios(id) ON DELETE SET NULL
);

-- Create monitoramento_abelhas (monitoring) table
CREATE TABLE monitoramento_abelhas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  colmeia_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  numero_abelhas INT NOT NULL,
  temperatura DECIMAL(5,2) NOT NULL,
  umidade DECIMAL(5,2),
  clima VARCHAR(50) NOT NULL,
  situacao ENUM('Normal', 'Alerta', 'Crítico', 'Em observação') DEFAULT 'Normal',
  observacoes TEXT,
  FOREIGN KEY (colmeia_id) REFERENCES colmeias(id) ON DELETE CASCADE
);

-- Create alertas (alerts) table
CREATE TABLE alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  colmeia_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  descricao_alerta TEXT NOT NULL,
  resolvido BOOLEAN DEFAULT FALSE,
  data_resolucao DATETIME,
  FOREIGN KEY (colmeia_id) REFERENCES colmeias(id) ON DELETE CASCADE
);

-- Create predator_types table
CREATE TABLE predator_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_perigo ENUM('Baixo', 'Médio', 'Alto') DEFAULT 'Médio',
  recomendacoes TEXT
);

-- Create predator_detection table to track predator detections
CREATE TABLE predator_detections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  colmeia_id INT NOT NULL,
  predator_type_id INT,
  data_hora DATETIME NOT NULL,
  descricao TEXT,
  acoes_tomadas TEXT,
  resolvido BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (colmeia_id) REFERENCES colmeias(id) ON DELETE CASCADE,
  FOREIGN KEY (predator_type_id) REFERENCES predator_types(id) ON DELETE SET NULL
);

-- =====================
-- INSERT SAMPLE DATA
-- =====================

-- Insert sample users
INSERT INTO usuarios (username, password, nome_completo, email, role, ultimo_login) VALUES 
('admin', 'admin', 'Administrador do Sistema', 'admin@smarthive.com', 'admin', NOW()),
('maria', 'senha123', 'Maria Silva', 'maria@gmail.com', 'usuario', NOW()),
('joao', 'senha456', 'João Pereira', 'joao@outlook.com', 'tecnico', NOW()),
('ana', 'senha789', 'Ana Oliveira', 'ana@yahoo.com', 'usuario', NOW());

-- Insert sample apiarios (apiaries)
INSERT INTO apiarios (nome, localizacao, responsavel, descricao) VALUES 
('Apiário Central', 'Fazenda São João, Km 12', 'João Pereira', 'Apiário principal com 20 colmeias de diversas espécies'),
('Apiário Sul', 'Estrada do Rio, próximo ao córrego', 'Maria Silva', 'Apiário experimental com foco em meliponas'),
('Apiário Bosque', 'Reserva Ambiental do Cerrado', 'Ana Oliveira', 'Apiário de preservação com abelhas nativas do cerrado'),
('Apiário Escola', 'Escola Técnica Agrícola', 'Roberto Santos', 'Apiário educativo para formação de novos meliponicultores');

-- Insert sample colmeias (hives)
INSERT INTO colmeias (nome, localizacao, status, especie, data_instalacao, apiario_id) VALUES 
('Colmeia 01', 'Setor A - Norte', 'Ativa', 'Jataí', '2023-01-15', 1),
('Colmeia 02', 'Setor A - Sul', 'Ativa', 'Mandaçaia', '2023-01-15', 1),
('Colmeia 03', 'Setor B - Leste', 'Em manutenção', 'Uruçu', '2023-02-10', 1),
('Colmeia 04', 'Entrada do Bosque', 'Ativa', 'Jataí', '2023-03-05', 3),
('Colmeia 05', 'Próximo ao Córrego', 'Ativa', 'Mandaçaia', '2023-03-20', 2),
('Colmeia 06', 'Entrada Principal', 'Ativa', 'Jataí', '2023-04-10', 2),
('Colmeia 07', 'Laboratório', 'Inativa', 'Mirim', '2023-04-25', 4),
('Colmeia 08', 'Campo Aberto', 'Ativa', 'Uruçu', '2023-05-12', 3),
('Colmeia 09', 'Perto do Lago', 'Ativa', 'Tiúba', '2023-06-01', 3),
('Colmeia 10', 'Jardim Botânico', 'Em manutenção', 'Mandaçaia', '2023-06-15', 4);

-- Insert sample monitoramento_abelhas (monitoring data)
INSERT INTO monitoramento_abelhas (colmeia_id, data_hora, numero_abelhas, temperatura, umidade, clima, situacao, observacoes) VALUES 
(1, '2023-10-01 08:00:00', 120, 24.5, 65.0, 'Ensolarado', 'Normal', 'Atividade normal de voo'),
(1, '2023-10-02 08:00:00', 115, 25.0, 62.0, 'Ensolarado', 'Normal', 'Comportamento normal'),
(1, '2023-10-03 08:00:00', 100, 23.0, 70.0, 'Parcialmente nublado', 'Normal', 'Leve redução na atividade'),
(1, '2023-10-04 08:00:00', 80, 22.0, 75.0, 'Nublado', 'Em observação', 'Redução na atividade devido ao clima'),
(1, '2023-10-05 08:00:00', 70, 21.0, 80.0, 'Chuvoso', 'Alerta', 'Pouca atividade externa'),
(2, '2023-10-01 09:00:00', 95, 24.0, 66.0, 'Ensolarado', 'Normal', 'Atividade normal'),
(2, '2023-10-02 09:00:00', 100, 25.5, 60.0, 'Ensolarado', 'Normal', 'Aumento no número de abelhas'),
(2, '2023-10-03 09:00:00', 90, 23.5, 68.0, 'Parcialmente nublado', 'Normal', 'Comportamento normal'),
(2, '2023-10-04 09:00:00', 85, 22.5, 72.0, 'Nublado', 'Normal', 'Leve redução na atividade'),
(2, '2023-10-05 09:00:00', 60, 21.5, 78.0, 'Chuvoso', 'Em observação', 'Redução na atividade de voo'),
(3, '2023-10-01 10:00:00', 110, 25.0, 62.0, 'Ensolarado', 'Normal', 'Colmeia forte e ativa'),
(3, '2023-10-02 10:00:00', 115, 26.0, 58.0, 'Ensolarado', 'Normal', 'Aumento de atividade'),
(3, '2023-10-03 10:00:00', 100, 24.0, 65.0, 'Parcialmente nublado', 'Normal', 'Comportamento normal'),
(3, '2023-10-04 10:00:00', 90, 23.0, 70.0, 'Nublado', 'Normal', 'Atividade reduzida, mas normal para o clima'),
(3, '2023-10-05 10:00:00', 50, 20.0, 82.0, 'Chuvoso', 'Crítico', 'Atividade muito baixa, verificar possíveis problemas'),
(4, '2023-10-01 08:30:00', 130, 23.5, 68.0, 'Ensolarado', 'Normal', 'Colmeia muito ativa'),
(4, '2023-10-02 08:30:00', 135, 24.5, 66.0, 'Ensolarado', 'Normal', 'Alta atividade de voo'),
(4, '2023-10-03 08:30:00', 125, 23.0, 70.0, 'Parcialmente nublado', 'Normal', 'Comportamento normal'),
(4, '2023-10-04 08:30:00', 100, 22.0, 75.0, 'Nublado', 'Normal', 'Redução normal devido ao clima'),
(4, '2023-10-05 08:30:00', 80, 21.0, 80.0, 'Chuvoso', 'Em observação', 'Redução significativa na atividade'),
(5, '2023-10-01 09:30:00', 140, 25.0, 65.0, 'Ensolarado', 'Normal', 'Atividade intensa de voo'),
(5, '2023-10-02 09:30:00', 145, 26.0, 62.0, 'Ensolarado', 'Normal', 'Colmeia muito forte'),
(5, '2023-10-03 09:30:00', 130, 24.0, 68.0, 'Parcialmente nublado', 'Normal', 'Atividade normal'),
(5, '2023-10-04 09:30:00', 120, 23.0, 72.0, 'Nublado', 'Normal', 'Bom comportamento mesmo com céu nublado'),
(5, '2023-10-05 09:30:00', 100, 21.5, 78.0, 'Chuvoso', 'Normal', 'Redução esperada devido à chuva');

-- Insert more recent monitoring data
INSERT INTO monitoramento_abelhas (colmeia_id, data_hora, numero_abelhas, temperatura, umidade, clima, situacao, observacoes) VALUES 
(1, '2023-10-20 08:00:00', 125, 26.5, 60.0, 'Ensolarado', 'Normal', 'Colmeia recuperou-se bem'),
(2, '2023-10-20 09:00:00', 105, 26.0, 62.0, 'Ensolarado', 'Normal', 'Atividade normal'),
(3, '2023-10-20 10:00:00', 80, 25.5, 64.0, 'Ensolarado', 'Em observação', 'Ainda com atividade reduzida'),
(4, '2023-10-20 08:30:00', 140, 26.5, 61.0, 'Ensolarado', 'Normal', 'Excelente atividade'),
(5, '2023-10-20 09:30:00', 150, 27.0, 58.0, 'Ensolarado', 'Normal', 'Colmeia muito forte'),
(1, '2023-10-21 08:00:00', 130, 27.0, 55.0, 'Ensolarado', 'Normal', 'Aumento na atividade'),
(2, '2023-10-21 09:00:00', 110, 26.5, 57.0, 'Ensolarado', 'Normal', 'Comportamento normal'),
(3, '2023-10-21 10:00:00', 85, 26.0, 60.0, 'Ensolarado', 'Em observação', 'Leve melhora na atividade'),
(4, '2023-10-21 08:30:00', 145, 27.5, 56.0, 'Ensolarado', 'Normal', 'Colmeia muito ativa'),
(5, '2023-10-21 09:30:00', 155, 28.0, 54.0, 'Ensolarado', 'Normal', 'Atividade intensa de voo'),
(1, '2023-10-22 08:00:00', 120, 25.0, 65.0, 'Parcialmente nublado', 'Normal', 'Atividade normal'),
(2, '2023-10-22 09:00:00', 105, 24.5, 68.0, 'Parcialmente nublado', 'Normal', 'Comportamento normal'),
(3, '2023-10-22 10:00:00', 75, 24.0, 70.0, 'Parcialmente nublado', 'Alerta', 'Atividade ainda baixa'),
(4, '2023-10-22 08:30:00', 130, 25.5, 66.0, 'Parcialmente nublado', 'Normal', 'Bom comportamento'),
(5, '2023-10-22 09:30:00', 145, 26.0, 64.0, 'Parcialmente nublado', 'Normal', 'Atividade levemente reduzida');

-- Insert data for all months to support seasonal analysis
INSERT INTO monitoramento_abelhas (colmeia_id, data_hora, numero_abelhas, temperatura, umidade, clima, situacao, observacoes) VALUES 
-- Janeiro (Summer)
(1, '2023-01-15 09:00:00', 150, 30.0, 70.0, 'Ensolarado', 'Normal', 'Alta atividade de verão'),
(2, '2023-01-15 10:00:00', 145, 31.0, 68.0, 'Ensolarado', 'Normal', 'Colmeia muito ativa no verão'),
-- Fevereiro (Summer)
(1, '2023-02-15 09:00:00', 160, 31.5, 72.0, 'Ensolarado', 'Normal', 'Pico de atividade no verão'),
(2, '2023-02-15 10:00:00', 155, 30.5, 70.0, 'Ensolarado', 'Normal', 'Colmeia forte no verão'),
-- Março (Fall starting)
(1, '2023-03-15 09:00:00', 140, 28.0, 75.0, 'Parcialmente nublado', 'Normal', 'Boa atividade no início do outono'),
(2, '2023-03-15 10:00:00', 135, 27.5, 74.0, 'Parcialmente nublado', 'Normal', 'Transição para outono'),
-- Abril (Fall)
(1, '2023-04-15 09:00:00', 120, 26.0, 78.0, 'Parcialmente nublado', 'Normal', 'Atividade de outono'),
(2, '2023-04-15 10:00:00', 115, 25.5, 80.0, 'Parcialmente nublado', 'Normal', 'Colmeia ajustando ao outono'),
-- Maio (Fall/Winter transition)
(1, '2023-05-15 09:00:00', 100, 22.0, 82.0, 'Nublado', 'Normal', 'Redução de atividade com clima mais frio'),
(2, '2023-05-15 10:00:00', 95, 21.5, 83.0, 'Nublado', 'Normal', 'Adaptação ao frio'),
-- Junho (Winter)
(1, '2023-06-15 09:00:00', 85, 19.0, 85.0, 'Nublado', 'Normal', 'Atividade reduzida de inverno'),
(2, '2023-06-15 10:00:00', 80, 18.5, 86.0, 'Nublado', 'Normal', 'Comportamento normal de inverno'),
-- Julho (Winter)
(1, '2023-07-15 09:00:00', 80, 18.0, 80.0, 'Nublado', 'Normal', 'Mínima atividade de inverno'),
(2, '2023-07-15 10:00:00', 75, 17.5, 82.0, 'Nublado', 'Normal', 'Colmeia conservando energia no inverno'),
-- Agosto (Winter/Spring transition)
(1, '2023-08-15 09:00:00', 90, 20.0, 75.0, 'Parcialmente nublado', 'Normal', 'Início da recuperação de atividade'),
(2, '2023-08-15 10:00:00', 95, 21.0, 74.0, 'Parcialmente nublado', 'Normal', 'Transição para primavera'),
-- Setembro (Spring)
(1, '2023-09-15 09:00:00', 110, 23.0, 70.0, 'Ensolarado', 'Normal', 'Aumento de atividade na primavera'),
(2, '2023-09-15 10:00:00', 115, 24.0, 68.0, 'Ensolarado', 'Normal', 'Colmeia fortalecendo na primavera');

-- Insert sample alertas (alerts)
INSERT INTO alertas (colmeia_id, data_hora, descricao_alerta, resolvido) VALUES 
(1, '2023-10-05 08:30:00', 'Redução significativa no número de abelhas', FALSE),
(3, '2023-10-05 10:30:00', 'Atividade crítica - possível problema interno', FALSE),
(2, '2023-10-10 09:15:00', 'Temperatura interna acima do normal', TRUE),
(4, '2023-10-12 14:00:00', 'Possível enxameação detectada', FALSE),
(5, '2023-10-15 11:30:00', 'Sinais de infestação de parasitas', FALSE),
(3, '2023-10-18 10:45:00', 'Presença de abelhas mortas na entrada', FALSE),
(1, '2023-10-22 08:30:00', 'Predador detectado: Vespa. Múltiplas vespas atacando abelhas na entrada.', FALSE);

-- Insert predator types
INSERT INTO predator_types (nome, descricao, nivel_perigo, recomendacoes) VALUES
('Formigas', 'Podem invadir colmeias em busca de mel e pólen, causando estresse às abelhas', 'Médio', 'Manter a colmeia elevada e usar barreiras físicas como graxa ou água ao redor dos suportes'),
('Aranhas', 'Podem caçar abelhas individualmente na entrada da colmeia', 'Baixo', 'Manter a área ao redor da colmeia limpa de teias'),
('Vespas', 'Predadores agressivos que podem matar várias abelhas e invadir a colmeia', 'Alto', 'Instalar armadilhas para vespas nas proximidades e reduzir a entrada da colmeia'),
('Pássaros', 'Algumas espécies de pássaros se alimentam de abelhas', 'Médio', 'Instalar redes de proteção ou arbustos próximos para oferecer refúgio às abelhas'),
('Lagartos', 'Podem se posicionar na entrada da colmeia para capturar abelhas', 'Baixo', 'Manter a área ao redor da colmeia livre de esconderijos para répteis'),
('Outros insetos', 'Diversos insetos podem predar abelhas ou competir por recursos', 'Médio', 'Monitorar regularmente e identificar o tipo específico para ação apropriada');

-- Insert sample predator detections
INSERT INTO predator_detections (colmeia_id, predator_type_id, data_hora, descricao, acoes_tomadas, resolvido) VALUES
(1, 3, '2023-10-22 08:30:00', 'Grupo de vespas atacando abelhas na entrada da colmeia', 'Instalada armadilha para vespas', FALSE),
(2, 1, '2023-10-05 09:45:00', 'Trilha de formigas tentando acessar a colmeia', 'Aplicada graxa nos suportes da colmeia', TRUE),
(4, 5, '2023-09-28 16:20:00', 'Lagarto observado caçando abelhas na entrada', 'Área ao redor da colmeia limpa de vegetação', FALSE),
(3, 3, '2023-10-10 11:15:00', 'Vespa rainha tentando estabelecer ninho próximo à colmeia', 'Ninho removido, área tratada com repelente natural', TRUE),
(5, 4, '2023-09-15 08:40:00', 'Pássaros predando abelhas em voo', 'Instaladas fitas refletivas e espanta-pássaros', TRUE),
(2, 3, '2023-10-19 14:30:00', 'Vespas tentando invadir a colmeia', 'Reduzida entrada da colmeia, instalada armadilha', FALSE),
(4, 6, '2023-10-01 10:25:00', 'Libélulas caçando abelhas em voo', 'Monitoramento adicional implementado', FALSE);

-- Add more monitoring data to support dashboard analytics
INSERT INTO monitoramento_abelhas (colmeia_id, data_hora, numero_abelhas, temperatura, umidade, clima, situacao, observacoes) VALUES 
(1, NOW() - INTERVAL 2 HOUR, 135, 26.2, 65.0, 'Ensolarado', 'Normal', 'Atividade normal de voo'),
(2, NOW() - INTERVAL 3 HOUR, 142, 26.5, 63.0, 'Ensolarado', 'Normal', 'Atividade intensa'),
(3, NOW() - INTERVAL 4 HOUR, 95, 25.8, 66.0, 'Parcialmente nublado', 'Normal', 'Comportamento normal'),
(4, NOW() - INTERVAL 5 HOUR, 128, 26.0, 64.0, 'Ensolarado', 'Normal', 'Atividade boa'),
(5, NOW() - INTERVAL 6 HOUR, 115, 25.5, 67.0, 'Ensolarado', 'Normal', 'Colmeia com boa população'),
(1, NOW() - INTERVAL 1 DAY - INTERVAL 2 HOUR, 130, 25.8, 66.0, 'Ensolarado', 'Normal', 'Atividade normal'),
(2, NOW() - INTERVAL 1 DAY - INTERVAL 3 HOUR, 138, 26.0, 64.0, 'Ensolarado', 'Normal', 'Atividade intensa'),
(3, NOW() - INTERVAL 1 DAY - INTERVAL 4 HOUR, 92, 25.5, 67.0, 'Parcialmente nublado', 'Em observação', 'Leve redução de atividade'),
(4, NOW() - INTERVAL 1 DAY - INTERVAL 5 HOUR, 125, 25.7, 65.0, 'Ensolarado', 'Normal', 'Atividade normal'),
(5, NOW() - INTERVAL 1 DAY - INTERVAL 6 HOUR, 112, 25.3, 68.0, 'Ensolarado', 'Normal', 'Comportamento normal'),
(1, NOW() - INTERVAL 3 DAY, 128, 25.5, 67.0, 'Ensolarado', 'Normal', 'Atividade normal'),
(1, NOW() - INTERVAL 4 DAY, 125, 25.0, 68.0, 'Parcialmente nublado', 'Normal', 'Comportamento normal'),
(1, NOW() - INTERVAL 5 DAY, 122, 24.8, 70.0, 'Nublado', 'Normal', 'Leve redução na atividade'),
(1, NOW() - INTERVAL 6 DAY, 120, 24.5, 72.0, 'Parcialmente nublado', 'Normal', 'Atividade adequada para o clima'),
(1, NOW() - INTERVAL 7 DAY, 118, 24.0, 73.0, 'Nublado', 'Normal', 'Atividade dentro do esperado'),
(2, NOW() - INTERVAL 2 DAY, 105, 25.5, 67.0, 'Ensolarado', 'Alerta', 'Possível predador nas proximidades'),
(2, NOW() - INTERVAL 3 DAY, 100, 25.0, 68.0, 'Ensolarado', 'Normal', 'Monitorando após alerta anterior'),
(3, NOW() - INTERVAL 2 DAY, 85, 25.2, 66.0, 'Ensolarado', 'Crítico', 'Queda brusca no número de abelhas');

-- Add more alert data for dashboard
INSERT INTO alertas (colmeia_id, data_hora, descricao_alerta, resolvido) VALUES 
(2, NOW() - INTERVAL 2 DAY, 'Predador detectado: Vespa. Presença de vespas atacando abelhas na entrada.', FALSE),
(3, NOW() - INTERVAL 2 DAY, 'Queda brusca no número de abelhas. Possível abandono da colmeia.', FALSE),
(1, NOW() - INTERVAL 3 DAY, 'Temperatura acima do normal registrada durante a tarde.', TRUE),
(4, NOW() - INTERVAL 4 DAY, 'Atividade reduzida apesar do clima favorável.', TRUE),
(5, NOW() - INTERVAL 5 DAY, 'Formigas tentando invadir a colmeia.', TRUE);

-- Add more predator detection data
INSERT INTO predator_detections (colmeia_id, predator_type_id, data_hora, descricao, acoes_tomadas, resolvido) VALUES
(2, 3, NOW() - INTERVAL 2 DAY, 'Múltiplas vespas atacando abelhas na entrada da colmeia', 'Instalação de armadilhas para vespas', FALSE),
(3, 1, NOW() - INTERVAL 3 DAY, 'Trilha de formigas se aproximando da colmeia', 'Aplicação de barreiras físicas ao redor da colmeia', TRUE),
(4, 4, NOW() - INTERVAL 4 DAY, 'Pássaros caçando abelhas em voo', 'Instalação de espantalhos e fitas refletivas', TRUE);

-- Add stored procedures for common operations

-- Procedure to get recent monitoring stats with date range
DELIMITER $$
CREATE PROCEDURE GetMonitoringStats(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        c.nome as colmeia,
        a.nome as apiario,
        AVG(m.numero_abelhas) as media_abelhas,
        AVG(m.temperatura) as media_temperatura,
        MIN(m.numero_abelhas) as min_abelhas,
        MAX(m.numero_abelhas) as max_abelhas,
        COUNT(*) as num_registros
    FROM 
        monitoramento_abelhas m
        JOIN colmeias c ON m.colmeia_id = c.id
        LEFT JOIN apiarios a ON c.apiario_id = a.id
    WHERE 
        m.data_hora BETWEEN CONCAT(start_date, ' 00:00:00') AND CONCAT(end_date, ' 23:59:59')
    GROUP BY 
        c.id
    ORDER BY 
        media_abelhas DESC;
END$$
DELIMITER ;

-- Procedure to get predator activity stats
DELIMITER $$
CREATE PROCEDURE GetPredatorStats()
BEGIN
    SELECT 
        pt.nome as predator_type,
        COUNT(pd.id) as detection_count,
        CONCAT(ROUND((SUM(CASE WHEN pd.resolvido = TRUE THEN 1 ELSE 0 END) / COUNT(*)) * 100), '%') as resolution_rate,
        pt.nivel_perigo as danger_level
    FROM 
        predator_detections pd
        JOIN predator_types pt ON pd.predator_type_id = pt.id
    GROUP BY 
        pd.predator_type_id
    ORDER BY 
        detection_count DESC;
END$$
DELIMITER ;

-- Procedure to get colony health report
DELIMITER $$
CREATE PROCEDURE GetColonyHealthReport(IN colmeia_id_param INT)
BEGIN
    DECLARE avg_bees DECIMAL(10,2);
    DECLARE last_month_avg DECIMAL(10,2);
    DECLARE avg_temp DECIMAL(10,2);
    DECLARE alert_count INT;
    DECLARE predator_count INT;
    DECLARE health_status VARCHAR(50);
    
    -- Get average number of bees over last week
    SELECT AVG(numero_abelhas) INTO avg_bees 
    FROM monitoramento_abelhas 
    WHERE colmeia_id = colmeia_id_param 
      AND data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Get average number of bees for previous month
    SELECT AVG(numero_abelhas) INTO last_month_avg
    FROM monitoramento_abelhas 
    WHERE colmeia_id = colmeia_id_param 
      AND data_hora BETWEEN DATE_SUB(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 30 DAY) 
                        AND DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Get average temperature
    SELECT AVG(temperatura) INTO avg_temp
    FROM monitoramento_abelhas 
    WHERE colmeia_id = colmeia_id_param 
      AND data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Get alert count
    SELECT COUNT(*) INTO alert_count
    FROM alertas
    WHERE colmeia_id = colmeia_id_param
      AND data_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Get predator detection count
    SELECT COUNT(*) INTO predator_count
    FROM predator_detections
    WHERE colmeia_id = colmeia_id_param
      AND data_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Determine health status
    IF avg_bees IS NULL THEN
        SET health_status = 'Sem dados recentes';
    ELSEIF last_month_avg IS NULL THEN
        SET health_status = 'Dados insuficientes para comparação';
    ELSEIF avg_bees < (last_month_avg * 0.7) THEN
        SET health_status = 'Crítico - Queda significativa de população';
    ELSEIF (predator_count > 2) THEN
        SET health_status = 'Alerta - Múltiplos predadores detectados';
    ELSEIF (alert_count > 3) THEN
        SET health_status = 'Requer atenção - Múltiplos alertas recentes';
    ELSEIF avg_bees < (last_month_avg * 0.85) THEN
        SET health_status = 'Requer atenção - Redução de população';
    ELSEIF avg_bees > (last_month_avg * 1.15) THEN
        SET health_status = 'Excelente - Crescimento de população';
    ELSE
        SET health_status = 'Normal - Estável';
    END IF;
    
    -- Return the health report
    SELECT 
        c.nome as colmeia_nome,
        c.status as status_colmeia,
        health_status as status_saude,
        avg_bees as media_abelhas_recente,
        last_month_avg as media_abelhas_anterior,
        IFNULL(ROUND(((avg_bees - last_month_avg) / last_month_avg) * 100, 1), 0) as variacao_percentual,
        avg_temp as temperatura_media,
        alert_count as num_alertas,
        predator_count as num_predadores,
        (SELECT MAX(data_hora) FROM monitoramento_abelhas WHERE colmeia_id = colmeia_id_param) as ultimo_monitoramento
    FROM colmeias c
    WHERE c.id = colmeia_id_param;
END$$
DELIMITER ;