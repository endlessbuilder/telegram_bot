const { default: mongoose, Schema } = require("mongoose");
const { getSydneyTime } = require("../utils");

const PaymentModel = () => {
  const PaymentsSchema = new Schema(
    {
      currencyId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "currencies",
      },
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
      user_address: {
        type: String,
      },
      admin_address: {
        type: String,
      },
      amount: {
        type: Number,
      },
      ipn_type: {
        type: String, // deposit, withdraw
      },
      txn_hash: {
        type: String,
      },
      DATE: {
        type: Date,
      },
    },
    { timestamps: true }
  );

  PaymentsSchema.pre("save", function () {
    this.set({ DATE: getSydneyTime() });
  });

  PaymentsSchema.pre("findOneAndUpdate", function () {
    this.set({ DATE: getSydneyTime() });
  });

  return mongoose.model("payments", PaymentsSchema);
};

module.exports = {
  PaymentModel: PaymentModel(),
};
