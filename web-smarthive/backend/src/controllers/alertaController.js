import Alerta from "../models/Alerta.js";

export const list = async (req, res) => {
  const { colmeia, aberto } = req.query;
  const filter = {};
  if (colmeia) filter.colmeia = colmeia;
  if (aberto === "true") filter.reconhecido = false;

  const docs = await Alerta.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(docs);
};

export const acknowledge = async (req, res) => {
  const doc = await Alerta.findByIdAndUpdate(
    req.params.id,
    { reconhecido: true },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Não encontrado" });
  res.json(doc);
};
