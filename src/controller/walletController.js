const { hdkey } = require("ethereumjs-wallet");
const bip39 = require("bip39");

exports.generateMnemonic = (digit) => {
  if (digit < 12 || digit > 24) return false;

  const ENT = (32 * digit * 11) / 33;

  if (Number.isInteger(ENT)) {
    const mnemonic = bip39.generateMnemonic(ENT);

    return mnemonic;
  } else {
    return false;
  }
};

exports.validate = (mnemonic) => {
  if (mnemonic) {
    const _valid = bip39.validateMnemonic(mnemonic);
    if (_valid) {
      const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic));
      const path = "m/44'/60'/0'/0/0";
      const wallet = hdwallet.derivePath(path).getWallet();
      const address = `0x${wallet.getAddress().toString("hex")}`;
      const privateKey = wallet.getPrivateKey().toString("hex");

      return {
        address,
        privateKey,
      };
    } else {
      return false;
    }
  } else {
    return false;
  }
};
