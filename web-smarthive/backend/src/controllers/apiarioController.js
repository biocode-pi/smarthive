import Apiario from "../models/Apiario.js";

export const list = async (req, res) => {
  const docs = await Apiario.find({ owner: req.user.id }).sort({ createdAt: -1 });
  res.json(docs);
};

export const create = async (req, res) => {
  const { nome, localizacao, descricao } = req.body;
  if (!nome) return res.status(400).json({ message: "Nome é obrigatório" });
  const doc = await Apiario.create({
    nome,
    localizacao: localizacao || "",
    descricao: descricao || "",
    owner: req.user.id
  });
  res.status(201).json(doc);
};

export const update = async (req, res) => {
  const doc = await Apiario.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Não encontrado" });
  res.json(doc);
};

export const remove = async (req, res) => {
  const ok = await Apiario.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!ok) return res.status(404).json({ message: "Não encontrado" });
  res.json({ ok: true });
};
