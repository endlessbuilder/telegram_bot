const Web3 = require("web3");
const GameConfig = require("../config/game.json");
const ABI = require("./token.json")

exports.EthereumWeb3 = new Web3(process.env.E_WEB3_URL);

exports.transferEthererum = async (reciever, amount) => {
  return new Promise(async (resolve, reject) => {

    this.EthereumWeb3.eth.getBalance(process.env.ADMIN_PUBLIC_WALLET_ADDRESS, async (error, result) => {
      if (error) {
        return reject("Insufficient amount!");
      }

      console.log("Admin ETH AMOUNT ===> ", result / 10 ** 18, "ETH")
      if (!result) {
        return reject("Insufficient funds!");
      }
      try {
        const gasPrice = await this.EthereumWeb3.eth.getGasPrice();
        const nonce = await this.EthereumWeb3.eth.getTransactionCount(process.env.ADMIN_PUBLIC_WALLET_ADDRESS);
        const sendAmount = this.EthereumWeb3.utils.toWei(String(amount))
        await this.EthereumWeb3.eth.accounts.wallet.add(process.env.ADMIN_PRIVATE_WALLET_ADDRESS)
        const account = this.EthereumWeb3.eth.accounts.privateKeyToAccount(process.env.ADMIN_PRIVATE_WALLET_ADDRESS)
        console.log("From => ", account.address, " To => ", reciever, " Amount => ", sendAmount, "Token")
        const createTransaction = await this.EthereumWeb3.eth.accounts.signTransaction(
          {
            gas: 21000,
            to: reciever,
            value: sendAmount,
            gasPrice,
            nonce,
          },
          process.env.ADMIN_PRIVATE_WALLET_ADDRESS
        );

        const createReceipt = await this.EthereumWeb3.eth.sendSignedTransaction(
          createTransaction.rawTransaction
        );

        console.log(
          createReceipt,
          `Transaction successful with hash: ${createReceipt.transactionHash}`
        );
        resolve(createReceipt.transactionHash)
      } catch (error) {
        console.log(error)
        return reject(error);
      }
    });
  });
};

exports.transferErc20Token = async (reciever, amount) => {
  return new Promise(async (resolve, reject) => {

    this.EthereumWeb3.eth.getBalance(process.env.ADMIN_PUBLIC_WALLET_ADDRESS, async (error, result) => {
      if (error) {
        return reject("Insufficient amount!");
      }

      console.log("Admin ETH AMOUNT ===> ", result / 10 ** 18, "ETH")
      if (!result) {
        return reject("Insufficient funds!");
      }
      try {
        const gasPrice = await this.EthereumWeb3.eth.getGasPrice();
        const sendAmount = this.EthereumWeb3.utils.toWei(String(amount))
        await this.EthereumWeb3.eth.accounts.wallet.add(process.env.ADMIN_PRIVATE_WALLET_ADDRESS)
        const account = this.EthereumWeb3.eth.accounts.privateKeyToAccount(process.env.ADMIN_PRIVATE_WALLET_ADDRESS)
        const TokenContract = new this.EthereumWeb3.eth.Contract(ABI, process.env.TOKEN_CONTRACT_ADDRESS)
        const gasLimit = await TokenContract.methods.transfer(reciever, sendAmount).estimateGas({ from: account.address })
        const totalGas = gasLimit * gasPrice; // withdraw fee (ETH)

        const limtGasFee = GameConfig.gas_limit_gwei;
        const currentGasFee = totalGas / 10 ** 9 // withdraw fee (gwei)

        if (limtGasFee > currentGasFee) {
          console.log("Transaction Gas Fee ==>", totalGas / 10 ** 18, "ETH")
          console.log("From => ", process.env.ADMIN_PUBLIC_WALLET_ADDRESS, " To => ", reciever, " Amount => ", amount, "Token")
          const result = await TokenContract.methods.transfer(reciever, sendAmount).send({ from: account.address, gasLimit, gasPrice })
          console.log(result, "result");
          resolve(result.transactionHash);
        } else {
          resolve("gasFee");
        }

      } catch (error) {
        console.log(error)
        return reject(error);
      }
    });
  });
};