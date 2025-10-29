import mongoose from "mongoose";

const registroSchema = new mongoose.Schema(
  {
    colmeia: { type: mongoose.Schema.Types.ObjectId, ref: "Colmeia", required: true },
    tipo: { type: String, enum: ["entrada", "saida", "predador", "temperatura", "umidade"], required: true },
    valor: { type: Number, default: 0 },
    metadata: { type: Object, default: {} },
    origem: { type: String, enum: ["camera", "manual"], default: "camera" }
  },
  { timestamps: true }
);

export default mongoose.model("Registro", registroSchema);
