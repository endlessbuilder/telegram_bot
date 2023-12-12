const { Schema, default: mongoose } = require("mongoose");

const AuctionModel = () => {
    var AuctionSchema = new Schema(
        {
            name: { type: String, required: true },
            price: { type: Number, default: 0.2 },
            period: { type: Number, default: 15 },
            token_id: { type: Number, required: false },
            MetaUrl: { type: String, required: false },
            winner: { type: Schema.Types.ObjectId, ref: "users" },
            type: { type: String, required: true },
            token_amount: { type: Number, required: false },
            active: { type: Boolean, default: true },
        },
        { timestamps: true }
    );

    AuctionSchema.pre("findOneAndUpdate", function () {
        this.populate("email");
    });

    AuctionSchema.pre("find", function () {
        this.populate("email");
    });

    AuctionSchema.pre("findOne", function () {
        this.populate("email");
    });


    return mongoose.model("auction", AuctionSchema);
};

module.exports = {
    AuctionModel: AuctionModel(),
};
