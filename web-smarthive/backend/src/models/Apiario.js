import mongoose from "mongoose";

const apiarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    localizacao: { type: String },
    descricao: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Apiario", apiarioSchema);
