const { Schema, default: mongoose } = require("mongoose");
const DateTime = require("date-and-time");
const bcrypt = require("bcrypt-nodejs");

const UserModel = () => {
  var UserSchema = new Schema(
    {
      username: { type: String, required: true, unique: true },
      email: { type: String, unique: true },
      password: { type: String, required: true },
      firstname: { type: String, default: "" },
      lastname: { type: String, default: "" },
      wallet_address: { type: String, default: "" },
      mobile: { type: Number },
      tg_id: { type: Number, unique: true },
      role_id: { type: Schema.Types.ObjectId, ref: "roles", required: true },
      status: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  UserSchema.methods.generateHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  };

  UserSchema.methods.validPassword = (password, encrypted) => {
    return bcrypt.compareSync(password, encrypted);
  };
  // UserSchema.pre("findOneAndUpdate", function () {
  //   this.populate("role_id", ["title"]);
  // });

  // UserSchema.pre("findOne", function () {
  //   this.populate("role_id", ["title"]);
  // });

  // UserSchema.pre("find", function () {
  //   this.populate("role_id", ["title"]);
  // });
  return mongoose.model("users", UserSchema);
};

module.exports = {
  UserModel: UserModel(),
};
