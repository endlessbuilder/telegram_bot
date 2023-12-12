const { BalanceModel } = require("../model/balanceModel");
// const { RoleModel } = require("../model/roleModel");
const { UserModel } = require("../model/userModel");
const { getUsersList } = require("./userController");
// const AdminConfig = require("../config/admin.json");
const GameConfig = require("../config/game.json");
const { generateMnemonic, validate } = require("./walletController");
const { PaymentModel } = require("../model/paymentModel");
const { encrypt } = require("../utils");

exports.updateBalance = async (req, res) => {
  try {
    const { user_id, currency_id, balance } = req.body;
    await BalanceModel.findOneAndUpdate(
      {
        userId: user_id,
        currency: currency_id,
      },
      {
        $inc: { balance: balance },
      }
    );

    getUsersList(req, res);
  } catch (error) {
    console.log("error in update balance :>> ", error);
    return res.status(500).json({ error: "Internal Server Error!" });
  }
};

exports.updateBetBalance = async (user_id, currency_id, balance) => {
  try {
    const adminUser = await UserModel.findOne({ email: "admin@gmail.com" });
    let _balance = balance;
    if (balance > 0) {
      // when user win bet
      _balance = balance * (1 - GameConfig.fee);
      await BalanceModel.findOneAndUpdate(
        {
          userId: adminUser._id,
          currency: currency_id,
        },
        {
          $inc: { balance: _balance * -1 },
        }
      );
    } else {
      // when user place a bet
      await BalanceModel.findOneAndUpdate(
        {
          userId: adminUser._id,
          currency: currency_id,
        },
        {
          $inc: { balance: _balance * -1 },
        }
      );
    }
    await BalanceModel.findOneAndUpdate(
      {
        userId: user_id,
        currency: currency_id,
      },
      {
        $inc: { balance: _balance },
      }
    );

    return true;
  } catch (error) {
    console.log("error in update bet balance :>> ", error);
    return false;
  }
};

exports.generateDepositAddress = async (user_id, currency_id) => {
  try {
    const payment = await PaymentModel.findOne({
      userId: user_id,
      currencyId: currency_id,
      ipn_type: "deposit",
      status: 0,
    });
    if (payment) {
      const wallet = await WalletModel.findById(payment.walletId);
      return wallet.address;
    }

    const mnemonic = generateMnemonic(12);
    if (!mnemonic) return false;
    const wallet = validate(mnemonic);
    if (!wallet) return false;

    const { address, privateKey } = wallet;

    const newWallet = new WalletModel({
      userId: user_id,
      mnemonic: encrypt(mnemonic),
      address,
      privateKey: encrypt(privateKey),
    });

    await newWallet.save();
    await PaymentModel.create({
      userId: user_id,
      currencyId: currency_id,
      walletId: newWallet._id,
      status: 0,
      ipn_type: "deposit",
      status_text: "pending",
    });

    return address;
  } catch (error) {
    console.log("error in generating deposit address :>> ", error);
    return false;
  }
};