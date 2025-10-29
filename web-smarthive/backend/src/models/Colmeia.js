import mongoose from "mongoose";

const colmeiaSchema = new mongoose.Schema(
  {
    identificador: { type: String, required: true },
    especie: { type: String, default: "Abelha nativa sem ferrão" },
    apiario: { type: mongoose.Schema.Types.ObjectId, ref: "Apiario", required: true },
    estado: { type: String, enum: ["saudável", "atenção", "critico"], default: "saudável" }
  },
  { timestamps: true }
);

export default mongoose.model("Colmeia", colmeiaSchema);
