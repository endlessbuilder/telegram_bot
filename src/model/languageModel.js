const { default: mongoose, Schema } = require("mongoose");
const { getSydneyTime } = require("../utils");

const LanguageModel = () => {
  const LanguageSchema = new Schema(
    {
      chatId: {
        type: Number,
        required: true,
      },
      language: {
        type: String,
        default: "en",
      },
    },
    { timestamps: true }
  );

  return mongoose.model("languages", LanguageSchema);
};

module.exports = {
  LanguageModel: LanguageModel(),
};
