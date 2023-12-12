const TelegramBot = require("node-telegram-bot-api");
// const DateTime = require("date-and-time");
const GameConfig = require("../config/game.json");
const { telegramRegister } = require("./userController");
const { UserModel } = require("../model/userModel");
const { HistoryModel } = require("../model/betModel");
const { AuctionModel } = require("../model/auctionModel");
const { BalanceModel } = require("../model/balanceModel");
const { CurrencyModel } = require("../model/currencyModel");
const { PaymentModel } = require("../model/paymentModel");

const { rtFixed } = require("../utils");
const {
  EthereumWeb3,
  transferEthererum,
  transferErc20Token,
} = require("../utils/ethereum");
const { i18n } = require("../i18n");
const { LanguageModel } = require("../model/languageModel");
const axios = require("axios");
const fs = require("fs");
const { DIR, SERVER_URL } = require("../../config");
const Buffer = require("buffer").Buffer;

let actioncash = {};
let auction = false;
let newState = false;
let activeInterval = false;
let winner = false;
let activePeriod = 0;

let totalBidCount = 0;
let totalTIme = 0;

exports.create = async (req, res) => {
  try {
    const { name, amount, txId, time, nft, MetaUrl } = req.body;

    const erc721TransferABI = [
      { type: "address", name: "from" },
      { type: "address", name: "to" },
      { type: "uint256", name: "tokens" },
    ];

    let transaction = await EthereumWeb3.eth.getTransaction(txId);
    if (transaction) {
      const decoded = await EthereumWeb3.eth.abi.decodeParameters(
        erc721TransferABI,
        transaction.input.slice(10)
      );
      if (decoded) {
        console.log(decoded, "decoded");

        if (decoded.to === process.env.ADMIN_PUBLIC_WALLET_ADDRESS) {
          let data = {
            name,
            price: amount,
            period: time,
            token_id: nft,
            MetaUrl,
            type: "nft",
          };
          auction = data;
          auction.txId = txId;
          newState = true;
          await AuctionModel.create(data);
          return res.status(200).json({ message: "New auction created !" });
        } else {
          return res.status(200).json({ message: "Failed transaction !" });
        }
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json("Server Error.");
  }
};

exports.createTokenAuction = async (req, res) => {
  try {
    const { name, amount, txId, time, token_amount } = req.body;

    console.log(req.body, "req.body");

    console.log(name, "name\n");
    console.log(amount, "amount\n");
    console.log(txId, "txId\n");

    const erc20TransferABI = [
      { type: "address", name: "receiver" },
      { type: "uint256", name: "amount" },
    ];
    let transaction = await EthereumWeb3.eth.getTransaction(txId);
    if (transaction) {
      const decoded = await EthereumWeb3.eth.abi.decodeParameters(
        erc20TransferABI,
        transaction.input.slice(10)
      );
      if (decoded) {
        console.log(decoded, "decoded");

        if (decoded.receiver === process.env.ADMIN_PUBLIC_WALLET_ADDRESS) {
          let data = {
            name,
            price: amount,
            period: time,
            type: "token",
            token_amount,
          };
          auction = data;
          auction.txId = txId;
          newState = true;
          await AuctionModel.create(data);
          return res.status(200).json({ message: "New auction created !" });
        } else {
          return res.status(200).json({ message: "Failed transaction !" });
        }
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json("Server Error.");
  }
};

const startAuction = async (bot) => {
  try {
    let startMessage = "";
    if (!auction) return;
    const { name, price, txId, period, token_id, MetaUrl, type } = auction;
    if (type === "nft") {
      let agentMetaUrl =
        "https://app.bueno.art/api/contract/Hq3x8HFdvVDpY8BTSzW3W/chain/1/metadata/1";
      const response = await axios.get(agentMetaUrl, {
        responseType: "application/json",
      });
      // const response = await axios.get(MetaUrl, { responseType: 'application/json' });
      const data = JSON.parse(response.data);
      currentNFTData = data;
      console.log(data, "======>data");
      const buffer = Buffer.from(response.data, "utf-8");
      let filename = `${txId}${token_id}.png`;
      await fetch(data.image).then(async (res) => {
        console.log("1");
        let blob = await res.blob();
        console.log("2");
        const buffer = Buffer.from(await blob.arrayBuffer());
        console.log("3");
        fs.createWriteStream(`${DIR}/assets/${filename}`).write(buffer);
      });
      let imgPath = SERVER_URL + "/" + filename;
      console.log(imgPath, "imgPath");
      startMessage = i18n(
        process.env.LANGUAGE,
        "auction.startedNFT",
        name,
        price,
        period
      );
    } else {
      startMessage = i18n(
        process.env.LANGUAGE,
        "auction.startedToken",
        name,
        price,
        period
        // auction.token_amount
      );
    }

    // let = `Name : ${data.name}\nToken ID : ${token_id}\nDescription : ${data.description}\nAuction Name : ${name}\nBidding Amount : ${price}${process.env.DEFAULT_CURRENCY}\nBidding Period : ${period}s\n`;
    // let startMessage = `<img src="${imgPath}" alt="nft-img" width="200" height = "200" > Name : ${data.name}\nToken ID : ${token_id}\nDescription : ${data.description}\nAuction Name : ${name}\nBidding Amount : ${price}${process.env.DEFAULT_CURRENCY}\nBidding Period : ${period}s\n`;
    activePeriod = period;

    // await bot.sendPhoto(process.env.INITAL_GROUP_ID, imgPath, { caption: startMessage })
    await bot.sendMessage(process.env.INITAL_GROUP_ID, startMessage, {
      parse_mode: "HTML",
    });
    // await bot.sendMessage(process.env.INITAL_GROUP_ID, "New Auction Created.");
    reSetAuctionTime(bot);
    setInterval(async () => {
      activePeriod--;
      if (activePeriod > 0 && activePeriod % 5 === 0) {
        let currentStatus = winner
          ? `highest bid by <a href="tg://user?id=${winner.id}">${
              winner.first_name ?? ""
            } ${winner.last_name ?? ""}</a>`
          : " there are no bids ";
        let timeRemainMsg = i18n(
          process.env.LANGUAGE,
          "auction.time_remain",
          activePeriod,
          name,
          currentStatus
        );
        bot
          .sendMessage(process.env.INITAL_GROUP_ID, timeRemainMsg, {
            parse_mode: "HTML",
          })
          .then((message) => {
            const chatId = message.chat.id;
            const messageID = message.message_id;
            setTimeout(() => {
              bot
                .deleteMessage(chatId, messageID)
                .then(() => {
                  console.log("Message deleted successfully");
                })
                .catch((error) => {
                  console.error("Error deleting message:");
                });
            }, 6000);
          });
        // await bot.sendMessage(process.env.INITAL_GROUP_ID, `${activePeriod} seconds remaining`);
      }
    }, 1000);
  } catch (error) {
    console.log(error, "error");
  }
};

const reSetAuctionTime = async (bot) => {
  const { period } = auction;
  // const { name, price, period, token_id } = auction;
  clearTimeout(activeInterval);
  activeInterval = setTimeout(() => {
    closeBid(bot);
  }, period * 1000);

  totalTIme += period - activePeriod;
  activePeriod = period;
};

const bid = async (bot, msg) => {
  if (!auction) {
    bot.sendMessage(msg.chat.id, "There is no auction in progress.", {
      parse_mode: "HTML",
    });
    return;
  }
  if (winner && winner?.id === msg.from.id) {
    let username = winner.first_name ?? "" + winner.last_name ?? "";
    let bid_already = i18n(
      process.env.LANGUAGE,
      "auction.bid_already",
      winner.id,
      username
    );

    await bot.sendMessage(msg.chat.id, bid_already, { parse_mode: "HTML" });
    // bot.sendMessage(msg.chat.id, 'You have already bid on this auction and there is no next bidder.', { parse_mode: "HTML" });
    return;
  }

  const { name, price, txId, period, token_id, MetaUrl } = auction;

  let user = await UserModel.findOne({ tg_id: msg.from.id });
  let currency = await CurrencyModel.findOne({
    symbol: process.env.DEFAULT_CURRENCY,
  });
  let balance = await BalanceModel.findOne({
    userId: user._id,
    currency: currency._id,
  });

  if (balance.balance >= price) {
    await BalanceModel.findOneAndUpdate(
      {
        userId: user._id,
        currency: currency._id,
      },
      {
        $inc: { balance: price * -1 },
      }
    );
    winner = msg.from;
    totalBidCount++;

    let cutBidStateMsg = `<a href="tg://user?id=${winner.id}">${
      winner.first_name ?? ""
    }${" "}${winner.last_name ?? ""}</a>`;
    let bid_placed = i18n(
      process.env.LANGUAGE,
      "auction.bid_placed",
      name,
      cutBidStateMsg,
      activePeriod,
      totalBidCount
    );
    bot.sendMessage(msg.chat.id, bid_placed, { parse_mode: "HTML" });
    reSetAuctionTime(bot);
  } else {
    bot.sendMessage(
      msg.chat.id,
      "You have not enough balance.\nAfter deposit please try again.",
      { parse_mode: "HTML" }
    );
  }
};

const transferNFT = async (nftId, to) => {
  try {
    nftId = 1;
    const gasPrice = await EthereumWeb3.eth.getGasPrice();
    await EthereumWeb3.eth.accounts.wallet.add(
      process.env.ADMIN_PRIVATE_WALLET_ADDRESS
    );
    const account = EthereumWeb3.eth.accounts.privateKeyToAccount(
      process.env.ADMIN_PRIVATE_WALLET_ADDRESS
    );
    // console.log(EthereumWeb3, "EthereumWeb3")
    // console.log(account, "account")
    const NFTContract = new EthereumWeb3.eth.Contract(
      [
        {
          inputs: [
            {
              internalType: "address",
              name: "from",
              type: "address",
            },
            {
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
          ],
          name: "transferFrom",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      process.env.CONTRACT_ADDRESS
    );
    const gasLimit = await NFTContract.methods
      .transferFrom(process.env.ADMIN_PUBLIC_WALLET_ADDRESS, to, nftId)
      .estimateGas({ from: account.address });
    console.log(gasPrice, "gasPrice");
    console.log(gasLimit, "gasLimit");
    const res = await NFTContract.methods
      .transferFrom(process.env.ADMIN_PUBLIC_WALLET_ADDRESS, to, nftId)
      .send({ from: account.address, gasLimit, gasPrice });
    console.log(res, "res");
    return res.transactionHash;
  } catch (error) {
    console.log(error, "error");
  }
};

const closeBid = async (bot) => {
  const { token_id, token_amount } = auction;
  auction = false;

  if (winner) {
    clearTimeout(activeInterval);
    let username = winner.first_name ?? "" + winner.last_name ?? "";
    let endMsg = i18n(
      process.env.LANGUAGE,
      "auction.end",
      winner.id,
      username,
      totalTIme,
      totalBidCount
    );

    await bot.sendMessage(process.env.INITAL_GROUP_ID, endMsg, {
      parse_mode: "HTML",
    });

    let toUser = await UserModel.findOne({ tg_id: winner.id });

    if (auction.type === "nft") {
      // let txID = await transferNFT(token_id, toUser.wallet_address);

      await bot.sendMessage(
        process.env.INITAL_GROUP_ID,
        `Please check <a href="tg://user?id=${winner.id}">${
          winner.first_name ?? ""
        }${" "}${
          winner.last_name ?? ""
        }</a> ! Here is the transaction link.\n\n${
          process.env.E_EXPLORER
        }/tx/${txID}`,
        { parse_mode: "HTML" }
      );
    } else {
      console.log(auction, "Auction Data");
      transferErc20Token(toUser.wallet_address, token_amount).then(
        async (txID) => {
          await bot.sendMessage(
            process.env.INITAL_GROUP_ID,
            `Please check <a href="tg://user?id=${winner.id}">${
              winner.first_name ?? ""
            }${" "}${
              winner.last_name ?? ""
            }</a> ! Here is the transaction link.\n\n${
              process.env.E_EXPLORER
            }/tx/${txID}`,
            { parse_mode: "HTML" }
          );
        }
      );
    }
  } else {
    bot.sendMessage(
      process.env.INITAL_GROUP_ID,
      "Auction Canceled.No one bid."
    );
  }
  winner = false;
  activePeriod = 0;
  totalBidCount = 0;
  totalTIme = 0;
};

const getBalance = async (lang, bot, msg) => {
  let user = await UserModel.findOne({ tg_id: msg.from.id });
  let currency = await CurrencyModel.findOne({
    symbol: process.env.DEFAULT_CURRENCY,
  });
  if (!user) {
    bot.sendMessage(msg.chat.id, i18n(lang, "statics.not_registered"), {
      parse_mode: "HTML",
    });
  } else {
    let balance = await BalanceModel.findOne({
      userId: user._id,
      currency: currency._id,
    });
    let reply = i18n(
      lang,
      "payments.balance",
      (msg.from.first_name + " " + (msg.from.last_name || "")).trim(),
      rtFixed(balance.balance).toFixed(4),
      `$${process.env.DEFAULT_CURRENCY}`
      // rtFixed(balance.balance)
    );
    bot.sendMessage(msg.chat.id, reply, { parse_mode: "HTML" });
  }
};

const availableOnlyGM = (lang, bot, msg) => {
  if (msg.chat.type == "private") {
    let reply = i18n(lang, "errors.gm_only");
    bot.sendMessage(msg.chat.id, reply);
    return false;
  } else {
    return true;
  }
};
const availableOnlyPM = (lang, bot, msg) => {
  if (msg.chat.type !== "private") {
    let reply = i18n(lang, "errors.pm_only");
    bot.sendMessage(msg.chat.id, reply);
    return false;
  } else {
    return true;
  }
};
const availableUser = async (bot, msg) => {
  const tg_id = msg.from.id;
  let existUser = await UserModel.findOne({
    tg_id,
  });
  if (existUser) {
    return true;
  } else {
    if (msg.chat.type === "private") {
      bot.sendMessage(
        msg.chat.id,
        `You have not registered yet.Please start with /start command and try again!`,
        { parse_mode: "HTML" }
      );
    } else {
      bot.sendMessage(
        msg.chat.id,
        `You have not registered yet.Please send me PM.`,
        { parse_mode: "HTML" }
      );
    }
    return false;
  }
};

const availableOnlyAdmin = async (lang, bot, msg) => {
  if (msg.from.username !== "staketony") {
    let reply = i18n(lang, "errors.admin_only");
    bot.sendMessage(msg.chat.id, reply);
    return false;
  } else {
    return true;
  }
};

const availableOnlyCreator = async (lang, bot, msg) => {
  if (msg.chat.type === "private") {
    return true;
  }
  let user_detail = await bot.getChatMember(msg.chat.id, msg.from.id);
  if (user_detail.status !== "creator") {
    let reply = i18n(lang, "errors.admin_only");
    bot.sendMessage(msg.chat.id, reply);
    return false;
  } else {
    return true;
  }
};

const setLanguage = async (lang, bot, msg) => {
  let value = msg.text.split(" ")[1];
  if (!value) return;

  value = value.toLowerCase().trim();
  if (value !== "en" || value !== "cn") {
    let result = await LanguageModel.findOneAndUpdate(
      { chatId: msg.chat.id },
      { language: value },
      {
        upsert: true,
        new: true,
      }
    );
    if (result) {
      return bot.sendMessage(msg.chat.id, i18n(lang, "settings.success_lang"), {
        parse_mode: "HTML",
      });
    } else {
      return bot.sendMessage(msg.chat.id, i18n(lang, "errors.internal_error"), {
        parse_mode: "HTML",
      });
    }
  } else {
    return;
  }
};

const registerWalletAddress = async (lang, bot, msg) => {
  let value = msg.text.split(" ")[1];
  if (!value) {
    bot.sendMessage(msg.chat.id, `Please try like this\n/connect 0x.....`);
    return;
  }
  value = value.toLowerCase().trim();
  let existWallet = await UserModel.aggregate([
    {
      $match: {
        tg_id: {
          $ne: msg.from.id,
        },
        wallet_address: value,
      },
    },
  ]);
  if (existWallet && existWallet.length > 0) {
    return bot.sendMessage(
      msg.chat.id,
      `This wallet address is already been used by other user`,
      {
        parse_mode: "HTML",
      }
    );
  } else {
    let checkAddress = await UserModel.findOne({
      tg_id: msg.from.id,
      wallet_address: value,
    });
    if (checkAddress) {
      return bot.sendMessage(
        msg.chat.id,
        "This address is already been used.\n",
        {
          parse_mode: "HTML",
        }
      );
    } else {
      let result = await UserModel.findOneAndUpdate(
        { tg_id: msg.from.id },
        { wallet_address: value }
      );
      if (result) {
        return bot.sendMessage(
          msg.chat.id,
          "The wallet address is successfully registered.\nYou must use this address when you deposit or withdraw.\n",
          {
            parse_mode: "HTML",
          }
        );
      } else {
        return bot.sendMessage(msg.chat.id, "Server Error!!!", {
          parse_mode: "HTML",
        });
      }
    }
  }
};

const inputCallBack = async (lang, bot, msg) => {
  if (msg.chat.type !== "private") return;

  let text = msg.text;
  let bool = actioncash[msg.from.id];

  if (text != bool && !text.includes("/")) {
    console.log("----------", bool, "----------");
    if (bool && bool.length && bool.split(":")) {
      let key1 = bool.split(":")[0];
      switch (key1) {
        case "deposit":
          inputCallbackDeposit(lang, text, bot, msg);
          break;
      }
    }
  }
};

const inputCallbackDeposit = async (lang, txn_id, bot, msg) => {
  actioncash[msg.from.id] = "";
  try {
    let user = await UserModel.findOne({ tg_id: msg.from.id });
    let currency = await CurrencyModel.findOne({
      symbol: process.env.DEFAULT_CURRENCY,
    });

    let transaction = await EthereumWeb3.eth.getTransaction(txn_id);
    // const erc20TransferABI = [
    //   { type: 'address', name: 'receiver' },
    //   { type: 'uint256', name: 'amount' }
    // ];

    if (transaction) {
      // const decoded = EthereumWeb3.eth.abi.decodeParameters(erc20TransferABI, transaction.input.slice(10));
      console.log(transaction, "transaction");
      // let depositValue = decoded.amount / (10 ** currency.decimals);
      let depositValue = transaction.value;

      if (Number(depositValue) > 0) {
        const existTxnHtry = await PaymentModel.findOne({
          txn_hash: transaction.hash,
        });

        if (existTxnHtry) {
          return bot.sendMessage(
            msg.chat.id,
            i18n(lang, "payments.deposit_already"),
            {
              parse_mode: "HTML",
            }
          );
        } else {
          if (
            user.wallet_address.toLowerCase() ===
              transaction.from.toLowerCase() &&
            transaction.to.toLowerCase() ===
              process.env.ADMIN_PUBLIC_WALLET_ADDRESS.toLowerCase()
          ) {
            let data = {
              currencyId: currency._id,
              userId: user._id,
              user_address: transaction.from,
              admin_address: transaction.to,
              amount: Number(depositValue) / 10 ** 18,
              ipn_type: GameConfig.payment.deposit,
              txn_hash: transaction.hash,
            };
            await new PaymentModel(data).save();

            await BalanceModel.findOneAndUpdate(
              {
                userId: user._id,
                currency: currency._id,
              },
              {
                $inc: {
                  balance: Number(depositValue) / 10 ** 18,
                },
              }
            );
            return bot.sendMessage(
              msg.chat.id,
              i18n(lang, "payments.deposit_success"),
              {
                parse_mode: "HTML",
              }
            );
          } else {
            return bot.sendMessage(
              msg.chat.id,
              "This is not your transaction."
            );
          }
        }
      }
    }
  } catch (error) {
    console.log("error in validate TXID :>> ", error);
    return bot.sendMessage(msg.chat.id, i18n(lang, "errors.invalid_txid"), {
      parse_mode: "HTML",
    });
  }
};

const deposit = async (lang, bot, msg) => {
  let userInfo = await UserModel.findOne({ tg_id: msg.from.id });
  if (userInfo?.wallet_address) {
    let reply = `Deposit a minimum of 0.01${process.env.DEFAULT_CURRENCY} to get started!\nPlease use your registered address for deposit!\n\n<code>${process.env.ADMIN_PUBLIC_WALLET_ADDRESS}</code>\n\nOnce your transaction is complete, send your Transaction Hash (TXID) so we can verify the transaction.\n\n🚨 Warning: If you don't use your registered address then you will lose your money`;
    return bot
      .sendMessage(msg.chat.id, reply, {
        parse_mode: "HTML",
      })
      .then((message) => {
        actioncash[msg.from.id] = "deposit";
      });
  } else {
    let reply = `You have not registered your wallet address.\nPlease register your wallet address and deposit again`;
    return bot.sendMessage(msg.chat.id, reply, {
      parse_mode: "HTML",
    });
  }
};

const inputCallbackWithdraw = async (lang, w_address, w_amount, bot, msg) => {
  actioncash[msg.from.id] = "";
  try {
    let user = await UserModel.findOne({ tg_id: msg.from.id });
    let currency = await CurrencyModel.findOne({
      symbol: process.env.DEFAULT_CURRENCY,
    });
    let amount = Number(w_amount);
    transferEthererum(w_address, amount)
      .then(async (txn_id) => {
        console.log(txn_id, "txn_id");
        if (txn_id === "gasFee") {
          return bot.sendMessage(
            msg.chat.id,
            i18n(lang, "payments.withdraw_gasfee"),
            { parse_mode: "HTML" }
          );
        } else {
          let data = {
            currencyId: currency._id,
            userId: user._id,
            user_address: user.wallet_address,
            admin_address: process.env.ADMIN_PUBLIC_WALLET_ADDRESS,
            amount: w_amount,
            ipn_type: GameConfig.payment.withdraw,
            txn_hash: txn_id,
          };
          await PaymentModel.create(data);
          await BalanceModel.findOneAndUpdate(
            {
              userId: user._id,
              currency: currency._id,
            },
            {
              $inc: { balance: Number(w_amount) * -1 },
            }
          );

          return bot.sendMessage(
            msg.chat.id,
            i18n(
              lang,
              "payments.withdraw_sucess",
              process.env.E_EXPLORER,
              txn_id
            ),
            {
              parse_mode: "HTML",
            }
          );
        }
      })
      .catch((err) => {
        console.log("err in sending to admin :>> ", err);
        return bot.sendMessage(
          msg.chat.id,
          i18n(lang, "errors.internal_error"),
          {
            parse_mode: "HTML",
          }
        );
      });
    console.log("amount :>> ", amount);
  } catch (error) {
    console.log("error in wtihdraw :>> ", error);
    return bot.sendMessage(msg.chat.id, i18n(lang, "errors.internal_error"), {
      parse_mode: "HTML",
    });
  }
};

const withdraw = async (lang, bot, msg) => {
  let amount = Math.abs(Number(msg.text.split(" ")[1]));
  if (!amount || isNaN(amount)) {
    let reply = i18n(lang, "payments.withdraw");
    return bot.sendMessage(msg.chat.id, reply, { parse_mode: "HTML" });
  }

  let user = await UserModel.findOne({ tg_id: msg.from.id });
  if (!user) {
    let user_detail = await bot.getChatMember(msg.chat.id, msg.from.id);
    let register = await telegramRegister(user_detail.user);
    if (!register) return;
    user = register;
  }

  let currency = await CurrencyModel.findOne({
    symbol: process.env.DEFAULT_CURRENCY,
  });
  let balance = await BalanceModel.findOne({
    userId: user._id,
    currency: currency._id,
  });

  if (amount > balance.balance) {
    return bot.sendMessage(msg.chat.id, i18n(lang, "errors.invalid_amount"));
  }

  // let reply = `You are withdrawing <b>${amount} ETH</b>.\n\nPlease send the ERC20 wallet address you would like to receive it in.`;
  let reply = i18n(
    lang,
    "payments.withdraw_address",
    amount,
    user.wallet_address
  );
  bot.sendMessage(msg.chat.id, reply, { parse_mode: "HTML" }).then((m) => {
    inputCallbackWithdraw(lang, user.wallet_address, amount, bot, msg);
  });
};

const start = async (lang, bot, msg) => {
  let user = await UserModel.findOne({ tg_id: msg.from.id });
  if (!user) {
    let user_detail = await bot.getChatMember(msg.chat.id, msg.from.id);
    let register = await telegramRegister(user_detail.user);
    if (!register) return;
  }
  let againUser = await UserModel.findOne({ tg_id: msg.from.id });
  let currency = await CurrencyModel.findOne({
    symbol: process.env.DEFAULT_CURRENCY,
  });
  let balance = await BalanceModel.findOne({
    userId: againUser._id,
    currency: currency._id,
  });
  let reply = i18n(
    lang,
    "statics.start_msg",
    msg.chat.id,
    `${msg.from.first_name ?? ""}${" "}${msg.from.last_name ?? ""}`,
    balance.balance.toFixed(2)
  );
  bot.sendMessage(msg.chat.id, reply, {
    parse_mode: "HTML",
  });
};

exports.runBot = async () => {
  const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true,
  });

  bot.on("polling_error", console.log);

  bot.getMe().then(function (info) {
    botName = info.first_name;
    console.log(`
    ${info.first_name} is ready, the username is @${info.username}
    `);
  });
  bot.on("message", async function (msg) {
    console.log(msg.chat.id, "========>ddddd");

    if (msg.text) {
      let language = await LanguageModel.findOne({ chatId: msg.chat.id });
      let lang = language ? language.language : process.env.LANGUAGE;

      switch (msg.text) {
        case "/info":
          await start(lang, bot, msg);
          break;
        case "/balance":
          getBalance(lang, bot, msg);
          break;
      }

      if (msg.text.startsWith("/start")) {
        if (!availableOnlyPM(lang, bot, msg)) return;
        await start(lang, bot, msg);
      } else if (msg.text.startsWith("/setlanguage")) {
        if (!(await availableOnlyCreator(lang, bot, msg))) return;
        setLanguage(lang, bot, msg);
      } else if (msg.text.startsWith("/connect")) {
        registerWalletAddress(lang, bot, msg);
      } else if (msg.text.startsWith("/withdraw")) {
        if (!availableOnlyPM(lang, bot, msg)) return;
        withdraw(lang, bot, msg);
      } else if (msg.text.startsWith("/deposit")) {
        // deposit
        if (!availableOnlyPM(lang, bot, msg)) return;
        deposit(lang, bot, msg);
      } else if (msg.text.startsWith("/here")) {
        if (!availableOnlyPM(lang, bot, msg)) return;
        bot.sendMessage(msg.chat.id, i18n(lang, "commands.list"), {
          parse_mode: "HTML",
        });
      } else if (msg.text.startsWith("/stats")) {
        if (!availableOnlyGM(lang, bot, msg)) return;
        let existUser = await availableUser(bot, msg);
        if (existUser) {
          stats(lang, bot, msg);
        }
      } else if (msg.text.startsWith("/bid")) {
        if (!availableOnlyGM(lang, bot, msg)) return;
        let existUser = await availableUser(bot, msg);
        if (existUser) {
          bid(bot, msg);
        }
      } else {
        inputCallBack(lang, bot, msg);
      }
    }
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data.split(":");
    if (data.length > 0) {
      if (data[0] === "kill") {
        killVillager(process.env.LANGUAGE, bot, data[1], data[2], msg);
      }
      if (data[0] === "lynch") {
        lynchKiller(
          process.env.LANGUAGE,
          bot,
          data[1],
          data[2],
          msg.from.username
        );
      }
    }
  });
  setInterval(() => {
    if (newState) {
      startAuction(bot);
      newState = false;
    }
  }, 500);
};
