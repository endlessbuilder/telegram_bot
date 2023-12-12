const { Schema, default: mongoose } = require("mongoose");
const { getSydneyTime } = require("../utils");

const BalanceModel = () => {
  const BalancesSchema = new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
      currency: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "currencies",
      },
      balance: {
        type: Number,
        default: 0,
        required: true,
      },
      status: {
        type: Boolean,
        default: true,
        required: true,
      },
      disabled: {
        type: Boolean,
        default: false,
        required: true,
      },
      DATE: {
        type: Date,
      },
    },
    { timestamps: true }
  );

  BalancesSchema.pre("findOneAndUpdate", function () {
    this.populate("currency");
  });

  BalancesSchema.pre("find", function () {
    this.populate("currency");
  });

  BalancesSchema.pre("findOne", function () {
    this.populate("currency");
  });

  BalancesSchema.pre("save", function () {
    this.set({ DATE: getSydneyTime() });
  });

  BalancesSchema.pre("findOneAndUpdate", function () {
    this.set({ DATE: getSydneyTime() });
  });

  return mongoose.model("balances", BalancesSchema);
};

module.exports = {
  BalanceModel: BalanceModel(),
};
