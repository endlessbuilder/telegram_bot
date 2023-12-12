/**
 * I18n dictionary for the en.
 */

const en = {
  commands: {
    list: `<b>These are command list for Imposter game.</b>\n/start\n/connect\n/deposit\n/withdraw\n/balance\n`
  },
  payments: {
    deposit: `🎲 Ready to play? Deposit a minimum of 0.1 ${process.env.DEFAULT_CURRENCY} to this address to get started!\n\n<b>0.02 ${process.env.DEFAULT_CURRENCY} = 200 coins added to balance</b>\n\n<code>{0}</code>\n\nOnce your transaction is complete, <b>send your Transaction Hash (TXID)</b> so we can verify the transaction.\n\n<b>🚨 Warning</b>: Depositing any coin other than ${process.env.DEFAULT_CURRENCY} May result in loss of funds`,
    deposit_success: `Success! Please check your /balance.`,
    withdraw: `Please specify the amount in ${process.env.DEFAULT_CURRENCY} you would like to withdraw.\n\n<b>/withdraw [amount in ${process.env.DEFAULT_CURRENCY}]</b>\n\nUse /balance to check your current balance`,
    withdraw_address: `Withdrawing <b>{0} ${process.env.DEFAULT_CURRENCY}</b> to your wallet address <code>{1}</code>.\n🚀 Shouldn't take more than a minute! ⏳\n`,
    withdraw_sucess: `Success! Here is the transaction link.\n\n{0}/tx/{1}`,
    withdraw_gasfee: `Currently gas fees are high, Please try again after some time.`,
    deposit_already: `You have already deposited using this Transaction Hash(TXID).`,
    balance: `{0}'s balance:\n<b>{1} {2}</b>\n`,
  },
  statics: {
    start_msg: `<b>Welcome to NFT Auction Bot !</b> \n\nUsername - <a href="tg://user?id={0}">{1}</a> \nYour Balance: {2} ETH 💰\n\nHow to join??\n1. Connect Wallet using command /connect 0x..{your wallet address}\n2. Deposit ETH using command /deposit\n3. Join the main group.\n4. Use command /bid \n\n/here for commands list.`,
    not_registered:
      "You are not registered yet. When you make first /deposit, you will be registered automatically.",
    not_enough_balance: "You don't have enough balance.",
  },
  auction: {
    startedToken: `⏰ Auction Live! ⏰ Time to bid! \n\nName - {0}\nUse /bid to place {1}  bid. Clock reset to {2} seconds with every bid.`,
    startedNFT: `⏰ Auction Live! ⏰ Time to bid! \n\nName - {0}\nUse /bid to place {1}  bid. Clock reset to {2} seconds with every bid.`,
    bid_placed: `<b>💰 Bid Placed!</b>\n\nName - {0}\n\nCurrent highest bid by {1}. Join the action! Use /bid to secure your win! 🎉\n\nTime left- {2} seconds\nTotal Bids placed- {3}`,
    time_remain: `<b>⏳ {0} Seconds Remaining!</b>\nName - {1}\n\nCurrent {2}. Place your /bid now to snatch the lead! 🚀`,
    end: `<b>🎉 Auction Ended!</b>\n\nNo bids were placed for 30 seconds. Congrats <a href="tg://user?id={0}">{1}</a> for being the last bidder! You win <a href="tg://user?id={0}">{1}</a> 🏆💰\n\nRun Time - {2}\nTotal Bids Placed - {3}`,
    bid_already: `<a href="tg://user?id={0}">{1}</a>, you already have the winning bid! No need to bid again.`,
  },
  errors: {
    internal_error: "Som${process.env.DEFAULT_CURRENCY}ing went wrong! Please try again later.",
    invalid_txid:
      "Invalid Transaction Hash. Are you sure you entered the correct hash? Please remove other texts or spaces.",
    invalid_amount: "Invalid amount!",
    pm_only: "Please send this command on PM.",
    gm_only: "You must run this command in a group",
    admin_only: "This command is available for only admin!",
  },
  settings: {
    success_lang: "Langauge is set successfully!",
  },
};

module.exports = en;
