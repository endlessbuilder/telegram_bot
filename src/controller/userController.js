const AdminConfig = require("../config/admin.json");
const { BalanceModel } = require("../model/balanceModel");
const { CurrencyModel } = require("../model/currencyModel");
const { RoleModel } = require("../model/roleModel");
const { SessionModel } = require("../model/sessionModel");
const { UserModel } = require("../model/userModel");
const { signAccessToken } = require("./baseController");
const randomstring = require("randomstring");

const aggregateQuery = [
  {
    $lookup: {
      from: "roles",
      localField: "role_id",
      foreignField: "_id",
      as: "role",
    },
  },
  {
    $lookup: {
      from: "balances",
      localField: "_id",
      foreignField: "userId",
      as: "balance",
    },
  },
  {
    $lookup: {
      from: "currencies",
      localField: "balance.currency",
      foreignField: "_id",
      as: "currency",
    },
  },
  {
    $unwind: "$role",
  },
  {
    $sort: { createdAt: 1 },
  },
];

exports.getUsersList = async (req, res) => {
  const result = await UserModel.aggregate(aggregateQuery);
  return res.status(200).json(result);
};

exports.login = async (req, res) => {
  const { password, email } = req.body;
  if (!password || !email) return res.status(400).json("Invalid field!");

  const user = await UserModel.findOne({
    $or: [
      {
        username: {
          $regex: new RegExp("^" + email.toLowerCase(), "i"),
        },
      },
      {
        email: {
          $regex: new RegExp("^" + email.toLowerCase(), "i"),
        },
      },
    ],
  });

  const adminRole = await RoleModel.findOne({
    role: AdminConfig.roles.admin.role,
  });

  if (!user) {
    return res.status(400).json(`We can't find with this email or username.`);
  } else if (!adminRole._id.equals(user.role_id)) {
    return res.status(400).json(`You can't access here.`);
  } else if (!user.validPassword(password, user.password)) {
    return res.status(400).json("Passwords do not match.");
  } else if (!user.status) {
    return res.status(400).json("Account has been blocked.");
  }
  const session = signAccessToken(req, res, user._id);
  await SessionModel.updateOne({ userId: user._id }, session, {
    new: true,
    upsert: true,
  });
  const userData = {
    _id: user._id,
    email: user.email,
    username: user.username,
    displayName: user.firstname + " " + user.lastname,
    role_id: user.role_id,
    wallet_address: user.wallet_address,
  };

  return res.status(200).json({
    status: true,
    accessToken: session.accessToken,
    user: userData,
  });
};

exports.myAccount = async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const accessToken = req.headers.authorization.split(" ")[1];
  const session = await SessionModel.findOne({ accessToken: accessToken });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await UserModel.findById(session.userId);

  const userData = {
    _id: user._id,
    email: user.email,
    username: user.username,
    displayName: user.firstname + " " + user.lastname,
    role_id: user.role_id,
    wallet_address: user.wallet_address,
  };

  return res.status(200).json({ user: userData });
};

exports.telegramRegister = async (user_data) => {
  try {
    const user = {
      tg_id: user_data.id,
      email: user_data.username,
      username: user_data.username,
      password: randomstring.generate(8),
      firstname: user_data.first_name,
      lastname: user_data.last_name,
    };
    const role = await RoleModel.findOne({
      role: AdminConfig.roles.player.role,
    });
    const currency = await CurrencyModel.findOne({
      symbol: process.env.DEFAULT_CURRENCY,
    });

    const newUser = new UserModel(user);
    newUser.password = newUser.generateHash(user.password);
    newUser.role_id = role._id;
    newUser.status = true;

    const newBalance = new BalanceModel({
      userId: newUser._id,
      currency: currency._id,
    });

    await newUser.save();
    await newBalance.save();

    return newUser;
  } catch (error) {
    console.log("error telegramRegister :>> ", error);
    return false;
  }
};
