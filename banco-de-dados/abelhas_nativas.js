// ==================================================
// CRIAÇÃO DA ESTRUTURA DO BANCO - SMART HIVE NoSQL
// MongoDB Shell (mongosh)
// ==================================================

// 1. SELECIONAR/CRIAR O BANCO DE DADOS
use abelhas_nativas;

// 2. CRIAR AS COLEÇÕES (Collections)
db.createCollection("apiarios");
db.createCollection("usuarios"); 
db.createCollection("predador_detections");
db.createCollection("predator_types");

print("✅ Coleções criadas com sucesso!");

// ==================================================
// 3. DEFINIR VALIDAÇÕES DE SCHEMA (OPCIONAL)
// ==================================================

// Validação para apiarios
db.runCommand({
  collMod: "apiarios",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "localizacao", "data_criacao"],
      properties: {
        nome: { bsonType: "string", maxLength: 100 },
        localizacao: { bsonType: "string", maxLength: 255 },
        responsavel: { bsonType: "string" },
        descricao: { bsonType: "string" },
        data_criacao: { bsonType: "date" },
        colmeias: {
          bsonType: "array",
          maxItems: 200, // Limite prático
          items: {
            bsonType: "object",
            required: ["nome", "localizacao", "status"],
            properties: {
              id: { bsonType: "int" },
              nome: { bsonType: "string" },
              localizacao: { bsonType: "string" },
              status: { 
                bsonType: "string",
                enum: ["Ativa", "Em manutenção", "Inativa"]
              },
              especie: { bsonType: "string" },
              data_instalacao: { bsonType: "date" },
              monitoramentos: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  properties: {
                    data_hora: { bsonType: "date" },
                    numero_abelhas: { bsonType: "int", minimum: 0 },
                    temperatura: { bsonType: "double", minimum: -10, maximum: 50 },
                    umidade: { bsonType: "double", minimum: 0, maximum: 100 },
                    clima: { bsonType: "string" },
                    situacao: { 
                      bsonType: "string",
                      enum: ["Normal", "Alerta", "Crítico", "Em observação"]
                    }
                  }
                }
              },
              alertas: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  properties: {
                    data_hora: { bsonType: "date" },
                    descricao_alerta: { bsonType: "string" },
                    resolvido: { bsonType: "bool" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// Validação para usuarios
db.runCommand({
  collMod: "usuarios",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "nome_completo", "role"],
      properties: {
        username: { 
          bsonType: "string", 
          pattern: "^[a-zA-Z0-9_]+$",
          maxLength: 50
        },
        password: { bsonType: "string" },
        nome_completo: { bsonType: "string", maxLength: 100 },
        email: { bsonType: "string" },
        role: { 
          bsonType: "string",
          enum: ["admin", "usuario", "tecnico"]
        },
        ultimo_login: { bsonType: "date" },
        data_criacao: { bsonType: "date" },
        apiarios_responsavel: {
          bsonType: "array",
          items: { bsonType: "int" }
        }
      }
    }
  }
});

// Validação para predador_detections
db.runCommand({
  collMod: "predador_detections",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["colmeia_id", "apiario_id", "data_hora"],
      properties: {
        colmeia_id: { bsonType: "int" },
        apiario_id: { bsonType: "int" },
        data_hora: { bsonType: "date" },
        descricao: { bsonType: "string" },
        acoes_tomadas: { bsonType: "string" },
        resolvido: { bsonType: "bool" },
        predator_type: {
          bsonType: "object",
          properties: {
            id: { bsonType: "int" },
            nome: { bsonType: "string" },
            nivel_perigo: { 
              bsonType: "string",
              enum: ["Baixo", "Médio", "Alto"]
            }
          }
        }
      }
    }
  }
});

// Validação para predator_types
db.runCommand({
  collMod: "predator_types",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "nivel_perigo"],
      properties: {
        nome: { bsonType: "string", maxLength: 100 },
        descricao: { bsonType: "string" },
        nivel_perigo: { 
          bsonType: "string",
          enum: ["Baixo", "Médio", "Alto"]
        },
        recomendacoes: { bsonType: "string" }
      }
    }
  }
});

print("✅ Validações de schema aplicadas!");

// ==================================================
// 4. CRIAR ÍNDICES PARA PERFORMANCE
// ==================================================

// ÍNDICES PARA APIARIOS
db.apiarios.createIndex({ "id": 1 }, { unique: true });
db.apiarios.createIndex({ "colmeias.id": 1 });
db.apiarios.createIndex({ "colmeias.status": 1 });
db.apiarios.createIndex({ "colmeias.monitoramentos.data_hora": -1 });
db.apiarios.createIndex({ "colmeias.alertas.resolvido": 1 });

// ÍNDICES PARA USUARIOS
db.usuarios.createIndex({ "username": 1 }, { unique: true });
db.usuarios.createIndex({ "email": 1 });
db.usuarios.createIndex({ "apiarios_responsavel": 1 });

// ÍNDICES PARA PREDADOR_DETECTIONS
db.predador_detections.createIndex({ "colmeia_id": 1 });
db.predador_detections.createIndex({ "apiario_id": 1 });
db.predador_detections.createIndex({ "resolvido": 1 });
db.predador_detections.createIndex({ "data_hora": -1 });
db.predador_detections.createIndex({ "predator_type.id": 1 });

// ÍNDICES PARA PREDATOR_TYPES
db.predator_types.createIndex({ "id": 1 }, { unique: true });
db.predator_types.createIndex({ "nivel_perigo": 1 });

print("✅ Índices criados com sucesso!");

// ==================================================
// 5. CRIAR ÍNDICES TTL (TIME-TO-LIVE)
// ==================================================

// TTL para monitoramentos antigos (90 dias)
db.apiarios.createIndex(
  { "colmeias.monitoramentos.data_hora": 1 },
  { 
    expireAfterSeconds: 7776000, // 90 dias em segundos
    partialFilterExpression: { 
      "colmeias.monitoramentos.data_hora": { $lt: new Date() }
    }
  }
);

// TTL para alertas resolvidos (30 dias)
db.apiarios.createIndex(
  { "colmeias.alertas.data_hora": 1 },
  { 
    expireAfterSeconds: 2592000, // 30 dias em segundos
    partialFilterExpression: { 
      "colmeias.alertas.resolvido": true 
    }
  }
);

print("✅ Índices TTL configurados!");

// ==================================================
// 6. VERIFICAR A ESTRUTURA CRIADA
// ==================================================

print("\n📊 ESTRUTURA DO BANCO CRIADA:");
print("==============================");

// Listar coleções
const collections = db.getCollectionNames();
print("Coleções criadas: " + collections.join(", "));

// Mostrar índices de cada coleção
collections.forEach(collectionName => {
  print(`\n📁 ${collectionName.toUpperCase()} - Índices:`);
  const indexes = db[collectionName].getIndexes();
  indexes.forEach(index => {
    print(`   - ${index.name}: ${JSON.stringify(index.key)}`);
  });
});

// Mostrar validações
print("\n⚡ VALIDAÇÕES CONFIGURADAS:");
collections.forEach(collectionName => {
  const stats = db.runCommand({ 
    collStats: collectionName 
  });
  if (stats.validator) {
    print(`   ✅ ${collectionName}: Validação ativa`);
  }
});

print("\n🎉 ESTRUTURA NoSQL CRIADA COM SUCESSO!");
print("=====================================");
print("Banco: abelhas_nativas");
print("Coleções: " + collections.length);
print("Pronto para receber dados!");



// ==================================================
// SCRIPT MONGOSHELL COMPLETO - SMART HIVE NoSQL
// Com exemplos de dados para todas as coleções
// ==================================================

// 1. SELECIONAR/CRIAR O BANCO DE DADOS
use abelhas_nativas;

print("🚀 Iniciando criação do banco SmartHive NoSQL...");

// 2. CRIAR AS COLEÇÕES
db.createCollection("apiarios");
db.createCollection("usuarios");
db.createCollection("predador_detections");
db.createCollection("predator_types");

print("✅ Coleções criadas: apiarios, usuarios, predador_detections, predator_types");

// ==================================================
// 3. INSERIR DADOS EXEMPLO - PREDATOR_TYPES (Catálogo)
// ==================================================

db.predator_types.insertMany([
  {
    id: 1,
    nome: "Formigas",
    descricao: "Podem invadir colmeias em busca de mel e pólen, causando estresse às abelhas",
    nivel_perigo: "Médio",
    recomendacoes: "Manter a colmeia elevada e usar barreiras físicas como graxa ou água ao redor dos suportes",
    data_criacao: new Date()
  },
  {
    id: 2,
    nome: "Aranhas",
    descricao: "Podem caçar abelhas individualmente na entrada da colmeia",
    nivel_perigo: "Baixo",
    recomendacoes: "Manter a área ao redor da colmeia limpa de teias",
    data_criacao: new Date()
  },
  {
    id: 3,
    nome: "Vespas",
    descricao: "Predadores agressivos que podem matar várias abelhas e invadir a colmeia",
    nivel_perigo: "Alto",
    recomendacoes: "Instalar armadilhas para vespas nas proximidades e reduzir a entrada da colmeia",
    data_criacao: new Date()
  },
  {
    id: 4,
    nome: "Pássaros",
    descricao: "Algumas espécies de pássaros se alimentam de abelhas",
    nivel_perigo: "Médio",
    recomendacoes: "Instalar redes de proteção ou arbustos próximos para oferecer refúgio às abelhas",
    data_criacao: new Date()
  }
]);

print(`✅ predator_types: ${db.predator_types.countDocuments()} documentos inseridos`);

// ==================================================
// 4. INSERIR DADOS EXEMPLO - USUARIOS
// ==================================================

db.usuarios.insertMany([
  {
    id: 1,
    username: "admin",
    password: "$2b$10$EXAMPLE_HASH_PASSWORD",
    nome_completo: "Administrador do Sistema",
    email: "admin@smarthive.com",
    role: "admin",
    ultimo_login: new Date("2025-01-20T10:30:00Z"),
    data_criacao: new Date("2024-01-15T00:00:00Z"),
    apiarios_responsavel: [1, 2, 3, 4],
    ativo: true
  },
  {
    id: 2,
    username: "maria_silva",
    password: "$2b$10$EXAMPLE_HASH_MARIA",
    nome_completo: "Maria Silva",
    email: "maria.silva@gmail.com",
    role: "usuario",
    ultimo_login: new Date("2025-01-20T09:15:00Z"),
    data_criacao: new Date("2024-02-10T00:00:00Z"),
    apiarios_responsavel: [1, 2],
    ativo: true
  },
  {
    id: 3,
    username: "joao_tec",
    password: "$2b$10$EXAMPLE_HASH_JOAO",
    nome_completo: "João Pereira",
    email: "joao.pereira@outlook.com",
    role: "tecnico",
    ultimo_login: new Date("2025-01-19T16:45:00Z"),
    data_criacao: new Date("2024-01-20T00:00:00Z"),
    apiarios_responsavel: [1, 3, 4],
    ativo: true
  },
  {
    id: 4,
    username: "ana_apicultora",
    password: "$2b$10$EXAMPLE_HASH_ANA",
    nome_completo: "Ana Oliveira",
    email: "ana.oliveira@yahoo.com",
    role: "usuario",
    ultimo_login: new Date("2025-01-18T14:20:00Z"),
    data_criacao: new Date("2024-03-05T00:00:00Z"),
    apiarios_responsavel: [3],
    ativo: true
  }
]);

print(`✅ usuarios: ${db.usuarios.countDocuments()} documentos inseridos`);

// ==================================================
// 5. INSERIR DADOS EXEMPLO - APIARIOS (Com dados embedded)
// ==================================================

db.apiarios.insertMany([
  {
    id: 1,
    nome: "Apiário Central",
    localizacao: "Fazenda São João, Km 12, Registro-SP",
    responsavel: "João Pereira",
    descricao: "Apiário principal com 20 colmeias de diversas espécies nativas",
    data_criacao: new Date("2023-01-15T00:00:00Z"),
    coordenadas: { lat: -24.487, lng: -47.843 },
    status: "Ativo",
    
    // COLMEIAS EMBEDDED
    colmeias: [
      {
        id: 1,
        nome: "Colmeia Jataí 01",
        localizacao: "Setor A - Norte",
        status: "Ativa",
        especie: "Jataí",
        data_instalacao: new Date("2023-01-15T00:00:00Z"),
        
        // MONITORAMENTOS EMBEDDED
        monitoramentos: [
          {
            id: 101,
            data_hora: new Date("2025-01-20T08:00:00Z"),
            numero_abelhas: 135,
            temperatura: 26.2,
            umidade: 65.0,
            clima: "Ensolarado",
            situacao: "Normal",
            observacoes: "Atividade normal de voo, abelhas trazendo pólen amarelo"
          },
          {
            id: 102,
            data_hora: new Date("2025-01-20T14:00:00Z"),
            numero_abelhas: 128,
            temperatura: 29.5,
            umidade: 58.0,
            clima: "Ensolarado",
            situacao: "Normal",
            observacoes: "Atividade intensa no período da tarde"
          },
          {
            id: 103,
            data_hora: new Date("2025-01-19T08:00:00Z"),
            numero_abelhas: 130,
            temperatura: 25.8,
            umidade: 68.0,
            clima: "Parcialmente nublado",
            situacao: "Normal",
            observacoes: "Comportamento normal com clima ameno"
          }
        ],
        
        // ALERTAS EMBEDDED
        alertas: [
          {
            id: 1001,
            data_hora: new Date("2025-01-18T11:30:00Z"),
            descricao_alerta: "Redução de 15% na atividade de voo",
            tipo: "ATIVIDADE",
            nivel: "Baixo",
            resolvido: true,
            data_resolucao: new Date("2025-01-19T08:00:00Z"),
            acao_tomada: "Monitoramento intensificado - situação normalizada"
          }
        ]
      },
      {
        id: 2,
        nome: "Colmeia Mandaçaia 01",
        localizacao: "Setor A - Sul",
        status: "Ativa",
        especie: "Mandaçaia",
        data_instalacao: new Date("2023-02-10T00:00:00Z"),
        
        monitoramentos: [
          {
            id: 201,
            data_hora: new Date("2025-01-20T09:00:00Z"),
            numero_abelhas: 142,
            temperatura: 26.5,
            umidade: 63.0,
            clima: "Ensolarado",
            situacao: "Normal",
            observacoes: "Colmeia muito ativa, alta produção de mel"
          }
        ],
        
        alertas: []
      },
      {
        id: 3,
        nome: "Colmeia Uruçu 01",
        localizacao: "Setor B - Leste",
        status: "Em manutenção",
        especie: "Uruçu",
        data_instalacao: new Date("2023-03-05T00:00:00Z"),
        
        monitoramentos: [
          {
            id: 301,
            data_hora: new Date("2025-01-20T10:00:00Z"),
            numero_abelhas: 85,
            temperatura: 25.8,
            umidade: 66.0,
            clima: "Parcialmente nublado",
            situacao: "Em observação",
            observacoes: "População reduzida, verificar possíveis problemas"
          }
        ],
        
        alertas: [
          {
            id: 3001,
            data_hora: new Date("2025-01-15T15:20:00Z"),
            descricao_alerta: "Queda brusca no número de abelhas - possível enxameação",
            tipo: "POPULACAO",
            nivel: "Alto",
            resolvido: false,
            acao_tomada: "Inspeção agendada para verificar rainha"
          }
        ]
      }
    ],
    
    // ESTATÍSTICAS CALCULADAS
    estatisticas: {
      total_colmeias: 3,
      colmeias_ativas: 2,
      colmeias_manutencao: 1,
      colmeias_inativas: 0,
      total_monitoramentos: 5,
      ultimo_monitoramento: new Date("2025-01-20T14:00:00Z"),
      alertas_ativos: 1
    }
  },
  {
    id: 2,
    nome: "Apiário Sul",
    localizacao: "Estrada do Rio, próximo ao córrego, Pariquera-Açu-SP",
    responsavel: "Maria Silva",
    descricao: "Apiário experimental com foco em meliponas do bioma Mata Atlântica",
    data_criacao: new Date("2023-03-20T00:00:00Z"),
    coordenadas: { lat: -24.715, lng: -47.881 },
    status: "Ativo",
    
    colmeias: [
      {
        id: 4,
        nome: "Colmeia Jataí 02",
        localizacao: "Próximo ao Córrego",
        status: "Ativa",
        especie: "Jataí",
        data_instalacao: new Date("2023-04-10T00:00:00Z"),
        
        monitoramentos: [
          {
            id: 401,
            data_hora: new Date("2025-01-20T08:30:00Z"),
            numero_abelhas: 155,
            temperatura: 25.8,
            umidade: 72.0,
            clima: "Ensolarado",
            situacao: "Normal",
            observacoes: "Colmeia muito forte e produtiva"
          }
        ],
        
        alertas: []
      }
    ],
    
    estatisticas: {
      total_colmeias: 1,
      colmeias_ativas: 1,
      colmeias_manutencao: 0,
      colmeias_inativas: 0,
      total_monitoramentos: 1,
      ultimo_monitoramento: new Date("2025-01-20T08:30:00Z"),
      alertas_ativos: 0
    }
  },
  {
    id: 3,
    nome: "Apiário Bosque",
    localizacao: "Reserva Ambiental do Cerrado, Sete Barras-SP",
    responsavel: "Ana Oliveira",
    descricao: "Apiário de preservação com abelhas nativas do cerrado brasileiro",
    data_criacao: new Date("2023-05-12T00:00:00Z"),
    coordenadas: { lat: -24.382, lng: -47.925 },
    status: "Ativo",
    
    colmeias: [
      {
        id: 5,
        nome: "Colmeia Tiúba 01",
        localizacao: "Perto do Lago",
        status: "Ativa",
        especie: "Tiúba",
        data_instalacao: new Date("2023-06-01T00:00:00Z"),
        
        monitoramentos: [
          {
            id: 501,
            data_hora: new Date("2025-01-20T09:30:00Z"),
            numero_abelhas: 148,
            temperatura: 26.0,
            umidade: 70.0,
            clima: "Ensolarado",
            situacao: "Normal",
            observacoes: "Abelhas grandes e muito ativas"
          }
        ],
        
        alertas: []
      }
    ],
    
    estatisticas: {
      total_colmeias: 1,
      colmeias_ativas: 1,
      colmeias_manutencao: 0,
      colmeias_inativas: 0,
      total_monitoramentos: 1,
      ultimo_monitoramento: new Date("2025-01-20T09:30:00Z"),
      alertas_ativos: 0
    }
  }
]);

print(`✅ apiarios: ${db.apiarios.countDocuments()} documentos inseridos`);
print(`✅ colmeias totais: ${db.apiarios.aggregate([{ $project: { count: { $size: "$colmeias" } } }]).toArray().reduce((acc, curr) => acc + curr.count, 0)}`);

// ==================================================
// 6. INSERIR DADOS EXEMPLO - PREDADOR_DETECTIONS
// ==================================================

db.predador_detections.insertMany([
  {
    id: 1,
    colmeia_id: 1,
    apiario_id: 1,
    data_hora: new Date("2025-01-18T14:30:00Z"),
    descricao: "Grupo de 5-7 vespas atacando abelhas na entrada da colmeia. Abelhas defensivas formando barreira.",
    predator_type: {
      id: 3,
      nome: "Vespas",
      nivel_perigo: "Alto"
    },
    evidencias: ["foto_vespas_entrada.jpg"],
    acoes_tomadas: "Instalada armadilha para vespas com atrativo de proteína. Reduzida entrada da colmeia.",
    resolvido: false,
    usuario_registro: 2,
    data_registro: new Date("2025-01-18T14:45:00Z")
  },
  {
    id: 2,
    colmeia_id: 2,
    apiario_id: 1,
    data_hora: new Date("2025-01-10T09:15:00Z"),
    descricao: "Trilha de formigas cortadeiras se aproximando da colmeia. Abelhas agitadas.",
    predator_type: {
      id: 1,
      nome: "Formigas",
      nivel_perigo: "Médio"
    },
    evidencias: ["video_formigas.mov"],
    acoes_tomadas: "Aplicada graxa nos suportes da colmeia. Criada barreira física com cinza.",
    resolvido: true,
    data_resolucao: new Date("2025-01-10T11:00:00Z"),
    usuario_registro: 3,
    data_registro: new Date("2025-01-10T09:30:00Z")
  },
  {
    id: 3,
    colmeia_id: 4,
    apiario_id: 2,
    data_hora: new Date("2025-01-15T16:20:00Z"),
    descricao: "Pássaro beija-flor predando abelhas em voo próximo à colmeia.",
    predator_type: {
      id: 4,
      nome: "Pássaros",
      nivel_perigo: "Médio"
    },
    evidencias: [],
    acoes_tomadas: "Instaladas fitas refletivas e espanta-pássaros móveis na área.",
    resolvido: true,
    data_resolucao: new Date("2025-01-16T08:00:00Z"),
    usuario_registro: 2,
    data_registro: new Date("2025-01-15T16:30:00Z")
  },
  {
    id: 4,
    colmeia_id: 3,
    apiario_id: 1,
    data_hora: new Date("2025-01-19T11:45:00Z"),
    descricao: "Teia de aranha armadeira construída próximo à entrada da colmeia.",
    predator_type: {
      id: 2,
      nome: "Aranhas",
      nivel_perigo: "Baixo"
    },
    evidencias: ["foto_teia_entrada.jpg"],
    acoes_tomadas: "Remoção manual da teia e limpeza da área ao redor.",
    resolvido: true,
    data_resolucao: new Date("2025-01-19T12:00:00Z"),
    usuario_registro: 3,
    data_registro: new Date("2025-01-19T11:50:00Z")
  }
]);


// ==================================================
// 7. CRIAR ÍNDICES PARA PERFORMANCE
// ==================================================

print("\n🔧 Criando índices para otimização...");

// ÍNDICES PARA APIARIOS
db.apiarios.createIndex({ "id": 1 }, { unique: true });
db.apiarios.createIndex({ "colmeias.id": 1 });
db.apiarios.createIndex({ "colmeias.status": 1 });
db.apiarios.createIndex({ "colmeias.monitoramentos.data_hora": -1 });
db.apiarios.createIndex({ "colmeias.alertas.resolvido": 1 });
db.apiarios.createIndex({ "status": 1 });

// ÍNDICES PARA USUARIOS
db.usuarios.createIndex({ "id": 1 }, { unique: true });
db.usuarios.createIndex({ "username": 1 }, { unique: true });
db.usuarios.createIndex({ "email": 1 });
db.usuarios.createIndex({ "apiarios_responsavel": 1 });
db.usuarios.createIndex({ "role": 1 });

// ÍNDICES PARA PREDADOR_DETECTIONS
db.predador_detections.createIndex({ "id": 1 }, { unique: true });
db.predador_detections.createIndex({ "colmeia_id": 1 });
db.predador_detections.createIndex({ "apiario_id": 1 });
db.predador_detections.createIndex({ "resolvido": 1 });
db.predador_detections.createIndex({ "data_hora": -1 });
db.predador_detections.createIndex({ "predator_type.id": 1 });

// ÍNDICES PARA PREDATOR_TYPES
db.predator_types.createIndex({ "id": 1 }, { unique: true });
db.predator_types.createIndex({ "nivel_perigo": 1 });

print("✅ Índices criados com sucesso!");

// ==================================================
// 8. CRIAR ÍNDICES TTL (TIME-TO-LIVE)
// ==================================================

print("\n⏰ Configurando índices TTL...");

// TTL para monitoramentos antigos (90 dias) - APENAS PARA NOVOS DOCUMENTOS
db.apiarios.createIndex(
  { "colmeias.monitoramentos.data_hora": 1 },
  { 
    expireAfterSeconds: 7776000, // 90 dias
    name: "ttl_monitoramentos_90dias"
  }
);

// TTL para alertas resolvidos (30 dias)
db.apiarios.createIndex(
  { "colmeias.alertas.data_hora": 1 },
  { 
    expireAfterSeconds: 2592000, // 30 dias
    partialFilterExpression: { 
      "colmeias.alertas.resolvido": true 
    },
    name: "ttl_alertas_resolvidos_30dias"
  }
);

print("✅ Índices TTL configurados!");

// ==================================================
// 9. VERIFICAR E MOSTRAR ESTATÍSTICAS
// ==================================================

print("\n📊 ESTATÍSTICAS FINAIS DO BANCO:");
print("=================================");

// Contagem por coleção
const stats = {
  apiarios: db.apiarios.countDocuments(),
  usuarios: db.usuarios.countDocuments(),
  predador_detections: db.predador_detections.countDocuments(),
  predator_types: db.predator_types.countDocuments()
};

Object.entries(stats).forEach(([collection, count]) => {
  print(`📁 ${collection}: ${count} documentos`);
});

// Estatísticas detalhadas de apiarios
const colmeiasStats = db.apiarios.aggregate([
  { $unwind: "$colmeias" },
  { 
    $group: {
      _id: "$colmeias.status",
      count: { $sum: 1 }
    }
  }
]).toArray();

print("\n🐝 ESTATÍSTICAS DE COLMEIAS:");
colmeiasStats.forEach(stat => {
  print(`   ${stat._id}: ${stat.count} colmeias`);
});

// Estatísticas de predadores
const predadorStats = db.predador_detections.aggregate([
  {
    $group: {
      _id: "$predator_type.nome",
      total: { $sum: 1 },
      resolvidos: { $sum: { $cond: ["$resolvido", 1, 0] } }
    }
  }
]).toArray();

print("\n🐺 ESTATÍSTICAS DE PREDADORES:");
predadorStats.forEach(stat => {
  const taxaResolucao = ((stat.resolvidos / stat.total) * 100).toFixed(1);
  print(`   ${stat._id}: ${stat.total} detecções (${taxaResolucao}% resolvidas)`);
});

// Mostrar índices criados
print("\n🔍 ÍNDICES CRIADOS POR COLEÇÃO:");
db.getCollectionNames().forEach(collection => {
  const indexes = db[collection].getIndexes();
  print(`\n📁 ${collection.toUpperCase()}:`);
  indexes.forEach(index => {
    const ttlInfo = index.expireAfterSeconds ? ` [TTL: ${index.expireAfterSeconds}s]` : '';
    print(`   🔹 ${index.name}: ${JSON.stringify(index.key)}${ttlInfo}`);
  });
});

// ==================================================
// 10. TESTAR ALGUMAS CONSULTAS
// ==================================================

print("\n🧪 TESTANDO CONSULTAS:");
print("======================");

// Consulta 1: Apiários com colmeias ativas
const apiariosAtivos = db.apiarios.find(
  { "colmeias.status": "Ativa" },
  { nome: 1, "colmeias.nome": 1, "colmeias.status": 1 }
).count();

print(`✅ Apiários com colmeias ativas: ${apiariosAtivos}`);

// Consulta 2: Alertas não resolvidos
const alertasAtivos = db.apiarios.aggregate([
  { $unwind: "$colmeias" },
  { $unwind: "$colmeias.alertas" },
  { $match: { "colmeias.alertas.resolvido": false } },
  { $count: "total_alertas" }
]).toArray();

print(`✅ Alertas ativos: ${alertasAtivos[0]?.total_alertas || 0}`);

// Consulta 3: Detecções de predadores recentes
const predadoresRecentes = db.predador_detections.find(
  { 
    data_hora: { $gte: new Date("2025-01-15T00:00:00Z") }
  },
  { predator_type: 1, data_hora: 1, resolvido: 1 }
).count();

print(`✅ Detecções de predadores recentes: ${predadoresRecentes}`);

// Consulta 4: Usuários por role
const usuariosPorRole = db.usuarios.aggregate([
  {
    $group: {
      _id: "$role",
      count: { $sum: 1 }
    }
  }
]).toArray();

print("✅ Distribuição de usuários por role:");
usuariosPorRole.forEach(role => {
  print(`   - ${role._id}: ${role.count} usuários`);
});

print("\n🎉 BANCO DE DADOS NoSQL CRIADO COM SUCESSO!");
print("===========================================");
print("📊 RESUMO FINAL:");
print(`   • Banco: abelhas_nativas`);
print(`   • Coleções: ${db.getCollectionNames().length}`);
print(`   • Documentos totais: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
print(`   • Colmeias cadastradas: ${colmeiasStats.reduce((acc, curr) => acc + curr.count, 0)}`);
print(`   • Índices criados: ${db.getCollectionNames().reduce((acc, coll) => acc + db[coll].getIndexes().length, 0)}`);
print("\n🚀 Pronto para uso! Use db.[coleção].find() para explorar os dados.")

// COMANDO PARA APAGAR O BANCO DE DADOS CRIADO
// use abelhas_nativas; 
// db.dropDatabase();