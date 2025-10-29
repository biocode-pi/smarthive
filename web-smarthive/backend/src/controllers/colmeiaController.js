import mongoose from "mongoose";
import Colmeia from "../models/Colmeia.js";

export const list = async (req, res) => {
  const { apiario } = req.query;
  const filter = apiario ? { apiario } : {};
  const docs = await Colmeia.find(filter).sort({ createdAt: -1 });
  res.json(docs);
};

export const create = async (req, res) => {
  try {
    // Log detalhado da requisição
    console.log("[POST /api/colmeias] Detalhes da requisição:");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Query:", req.query);
    console.log("Content-Type:", req.get('Content-Type'));

    // Verificar se o corpo da requisição está vazio ou undefined
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Corpo da requisição está vazio",
        receivedBody: req.body,
        contentType: req.get('Content-Type')
      });
    }

    // Normalização de campos com validação mais detalhada
    let identificador = "";
    try {
      identificador = (req.body.identificador ?? req.body.identifier ?? req.body.nome ?? "").toString().trim();
    } catch (e) {
      console.error("Erro ao processar identificador:", e);
      identificador = "";
    }

    let especie = "Abelha nativa sem ferrão";
    try {
      if (req.body.especie || req.body.species) {
        especie = (req.body.especie ?? req.body.species).toString().trim();
      }
    } catch (e) {
      console.error("Erro ao processar especie:", e);
    }

    const apiario = req.body.apiario ?? req.body.apiary;

    // Log dos dados processados
    console.log("Dados processados:", { identificador, especie, apiario });

    // Validação de campos obrigatórios
    const faltando = [];
    if (!identificador) faltando.push("identificador");
    if (!apiario) faltando.push("apiario");

    if (faltando.length) {
      return res.status(400).json({
        message: `Campos obrigatórios ausentes: ${faltando.join(", ")}`,
        receivedKeys: Object.keys(req.body),
        processedData: { identificador, especie, apiario }
      });
    }

    // Verifica se o apiário existe
    if (!mongoose.Types.ObjectId.isValid(apiario)) {
      return res.status(400).json({
        message: "ID do apiário inválido",
        receivedApiarioId: apiario
      });
    }

    const doc = await Colmeia.create({ 
      identificador, 
      especie, 
      apiario,
      estado: "saudável" // valor padrão explícito
    });

    // Popula os dados do apiário na resposta
    await doc.populate('apiario');
    res.status(201).json(doc);
  } catch (err) {
    console.error("Erro ao criar colmeia:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Erro de validação",
        details: err.message 
      });
    }
    res.status(500).json({ message: "Erro interno ao criar colmeia" });
  }
};

export const update = async (req, res) => {
  const doc = await Colmeia.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: "Não encontrado" });
  res.json(doc);
};

export const remove = async (req, res) => {
  const ok = await Colmeia.findByIdAndDelete(req.params.id);
  if (!ok) return res.status(404).json({ message: "Não encontrado" });
  res.json({ ok: true });
};
