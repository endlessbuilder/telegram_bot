const { Schema, default: mongoose } = require("mongoose");

const HistoryModel = () => {
    var HistorySchema = new Schema(
        {
            username: { type: String, required: true },
            email: { type: String, required: true },
            firstname: { type: String, default: "" },
            lastname: { type: String, default: "" },
            gameKey: { type: String },
            gameID: { type: String },
            wallet_address: { type: String, default: "" },
            tg_id: { type: Number },
            bet_amount: { type: Number },
            status: { type: String },
            win_amount: { type: Number, default: 0 }

        },
        { timestamps: true }
    );

    return mongoose.model("history", HistorySchema);
};

module.exports = {
    HistoryModel: HistoryModel(),
};
