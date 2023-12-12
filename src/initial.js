const config = require("../config");
const path = require('path');
require('dotenv').config({ path: path.join(config.DIR, '.env') });
const mongoose = require("mongoose");
const { UserModel } = require("./model/userModel");
const { BalanceModel } = require("./model/balanceModel");
const AdminConfig = require("./config/admin.json");
const { RoleModel } = require("./model/roleModel");
const { CurrencyModel } = require("./model/currencyModel");

const initCurrency = {
  name: "Ethereum",
  symbol: process.env.DEFAULT_CURRENCY,
  icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  payment: "Ethereum",
  coingecko: "eth",
  price: 1,
  minDeposit: 100,
  minWithdraw: 5000,
  minBet: 1,
  maxBet: 5000,
  adminAddress: process.env.ADMIN_PUBLIC_WALLET_ADDRESS,
  contractAddress: process.env.CONTRACT_ADDRESS,
  type: 2,
  status: true,
  betLimit: 5000,
  deposit: true,
  withdrawal: true,
  officialLink: "",
  order: 5,
  decimals: 18,
  network: "ethereum",
};

const roles = [AdminConfig.roles.admin, AdminConfig.roles.player];

try {
  mongoose
    .connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      await RoleModel.insertMany(roles);
      const newRole = await RoleModel.findOne({
        role: AdminConfig.roles.admin.role,
      });
      const newCurrency = new CurrencyModel(initCurrency);
      const user = {
        email: "admin@gmail.com",
        username: "admin",
        password: "admin123$",
        firstname: "admin",
      };
      const newUser = new UserModel(user);
      newUser.password = newUser.generateHash(user.password);
      newUser.role_id = newRole._id;
      newUser.status = true;
      const newBalance = new BalanceModel({
        userId: newUser._id,
        currency: newCurrency._id,
      });
      await newCurrency.save();
      await newUser.save();
      await newBalance.save();
      console.log("done!!!");
    });
} catch (error) {
  console.log("error :>> ", error);
}
