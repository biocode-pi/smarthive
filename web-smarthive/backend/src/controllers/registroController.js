import mongoose from "mongoose";
import Registro from "../models/Registro.js";
import Alerta from "../models/Alerta.js";
import { emitAlert } from "../utils/bus.js";

// Regras simples de alerta
const maybeCreateAlert = async (r) => {
  let alert = null;

  if (r.tipo === "predador") {
    alert = await Alerta.create({
      colmeia: r.colmeia,
      nivel: "danger",
      mensagem: "Possível predador detectado na entrada da colmeia",
      origem: "camera"
    });
  }

  if (r.tipo === "entrada" && r.valor < 3) {
    alert = await Alerta.create({
      colmeia: r.colmeia,
      nivel: "warning",
      mensagem: "Baixo fluxo de entrada de abelhas",
      origem: "motor-alerta"
    });
  }

  if (alert) emitAlert(alert);
};

export const list = async (req, res) => {
  const { colmeia } = req.query;
  const filter = colmeia ? { colmeia } : {};
  const docs = await Registro.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(docs);
};

export const create = async (req, res) => {
  const { colmeia, tipo, valor, origem, metadata } = req.body;
  if (!colmeia || !tipo) return res.status(400).json({ message: "colmeia e tipo são obrigatórios" });

  const doc = await Registro.create({
    colmeia,
    tipo,
    valor: typeof valor === "number" ? valor : 0,
    origem: origem || "manual",
    metadata: metadata || {}
  });

  await maybeCreateAlert(doc);
  res.status(201).json(doc);
};

// Simulação de câmera
export const simulate = async (req, res) => {
  try {
    console.log("Simulate - Body recebido:", req.body);
    
    const { colmeia } = req.body;
    
    if (!colmeia) {
      return res.status(400).json({ 
        message: "colmeia é obrigatória",
        receivedBody: req.body
      });
    }

    // Validar se a colmeia existe e é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(colmeia)) {
      return res.status(400).json({ 
        message: "ID da colmeia inválido",
        receivedColmeiaId: colmeia
      });
    }

    const tipos = ["entrada", "saida", "predador"];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const valor = tipo === "predador" ? 1 : Math.floor(Math.random() * 10);

    const doc = await Registro.create({ 
      colmeia, 
      tipo, 
      valor, 
      origem: "camera",
      metadata: {
        simulado: true,
        timestamp: new Date().toISOString()
      }
    });

    await maybeCreateAlert(doc);
    res.status(201).json(doc);
  } catch (error) {
    console.error("Erro ao simular registro:", error);
    res.status(500).json({ 
      message: "Erro interno ao simular registro",
      error: error.message
    });
  }
};
