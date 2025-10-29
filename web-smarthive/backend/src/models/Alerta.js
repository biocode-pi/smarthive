import mongoose from "mongoose";

const alertaSchema = new mongoose.Schema(
  {
    colmeia: { type: mongoose.Schema.Types.ObjectId, ref: "Colmeia" },
    nivel: { type: String, enum: ["info", "warning", "danger"], default: "info" },
    mensagem: { type: String, required: true },
    origem: { type: String, default: "motor-alerta" },
    reconhecido: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Alerta", alertaSchema);
