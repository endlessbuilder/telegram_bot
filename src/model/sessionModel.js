const { default: mongoose, Schema } = require("mongoose");

const SessionModel = () => {
  const SessionSchema = new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "users",
      },
      socketId: {
        type: String,
      },
      accessToken: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
      passwordToken: {
        type: String,
      },
      expiration: {
        type: Date,
      },
      country: {
        type: String,
      },
      range: {
        type: Object,
      },
      useragent: {
        type: Object,
      },
    },
    { timestamps: true }
  );

  return mongoose.model("sessions", SessionSchema);
};

module.exports = {
  SessionModel: SessionModel(),
};
