const { Schema, default: mongoose } = require("mongoose");

const RoleModel = () => {
  const RoleSchema = new Schema(
    {
      title: { type: String, required: true },
      order: { type: Number, default: 0 },
      role: { type: Number, required: true, unique: true },
    },
    { timestamps: true }
  );

  return mongoose.model("roles", RoleSchema);
};

module.exports = {
  RoleModel: RoleModel(),
};
