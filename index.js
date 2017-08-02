'use strict'

const assert = require('assert')

const fetch = require('node-fetch')
const qs = require('qs')
const stringify = require('fast-safe-stringify')

const BASE_URL = 'https://api.mybitx.com/api/1'

function createRequest ({ path, headers, query, data, method } = {}) {
  const opts = {
    headers,
    method: method || (data ? 'POST' : 'GET')
  }

  if (data) {
    opts.body = stringify(data)
  }

  return fetch(
    `${BASE_URL}${path}${query ? `?${qs.stringify(query)}` : ''}`,
    opts
  ).then(res => {
    if (res.ok) {
      return res.json()
    }

    return Promise.reject({
      error: { status: res.status, message: res.statusText }
    })
  })
}

class Luno {
  constructor ({ key, secret, defaultPair } = {}) {
    assert(key, 'no key provided')
    assert(secret, 'no secret provided')

    this.headers = {
      Accept: 'application/json',
      'Accept-Charset': 'utf-8',
      Authorization: `Basic ${new Buffer(key + ':' + secret).toString(
        'base64'
      )}`
    }

    this.defaultPair = defaultPair || 'XBTZAR'
  }

  /**
   * Returns the latest ticker indicators.
   *
   * @param {String=} pair Currency pair e.g. XBTZAR
   *
   * @example
   * client.getTicker().then(console.log).catch(console.log)
   *
   */
  getTicker (pair) {
    pair = pair || this.defaultPair

    return createRequest({
      headers: this.headers,
      path: '/ticker',
      query: { pair }
    })
  }

  /**
   * Returns the latest ticker indicators from all active Luno exchanges.
   *
   * @example
   * client.getAllTickers().then(console.log).catch(console.log)
   *
   */
  getAllTickers () {
    return createRequest({
      path: '/tickers',
      headers: this.headers
    })
  }

  /**
   * Returns a list of bids and asks in the order book
   *
   * @param {String=} pair Currency pair e.g. XBTZAR
   *
   * @example
   * client.getOrderBook().then(console.log).catch(console.log)
   *
   */
  getOrderBook (pair) {
    pair = pair || this.defaultPair

    return createRequest({
      path: '/orderbook',
      query: { pair },
      headers: this.headers
    })
  }

  /**
   * Returns a list of the most recent trades.
   * At most 100 results are returned per call.
   *
   * @param {Number|String|Date=} since Fetch trades executed after this time
   * @param {String=} pair Currency pair e.g. XBTZAR
   *
   * @example
   * client.getTrades(new Date('7/7/7')).then(console.log).catch(console.log)
   *
   */
  getTrades (since, pair) {
    pair = pair || this.defaultPair

    if (since && since instanceof Date) {
      since = since.getTime() / 1000 // Convert to unix timestamp
    }

    return createRequest({
      headers: this.headers,
      path: '/trades',
      query: { pair, since }
    })
  }

  /**
   * Create an additional account for the specified currency.
   *
   * @param {String} name The label to use for this account e.g. "Trading ACC"
   * @param {String} currency The currency code for the account you want to create e.g. XBT, IDR, MYR, ZAR
   */
  createAccount (name = '', currency = '') {
    assert(name, 'name is required')
    assert(currency, 'currency is required')

    return createRequest({
      headers: this.headers,
      path: '/accounts',
      data: { currency, name }
    })
  }

  /**
   * Return the list of all accounts and their respective balances.
   *
   * @example
   * client.getBalances().then(console.log).catch(console.log)
   *
   */
  getBalances () {
    return createRequest({
      headers: this.headers,
      path: '/balance'
    })
  }

  /**
   * Return a list of transaction entries from an account.
   *  By default fetches the 100 most recent rows.
   *
   * @param {String|Number} id Account ID
   * @param {String|Number=} minRow Minimum of the row range to return (inclusive)
   * @param {String|Number=} maxRow Maximum of the row range to return (exclusive)
   *
   */
  getTransactions (id = '', minRow = -100, maxRow = 0) {
    assert(id, 'account ID is required')

    return createRequest({
      headers: this.headers,
      path: `/accounts/${id}/transactions`,
      query: { min_row: minRow, max_row: maxRow }
    })
  }

  /**
   * Return a list of all pending transactions related to the account.
   *
   * @param {String|Number} id Account ID
   *
   */
  getPendingTransactions (id = '') {
    assert(id, 'account ID is required')

    return createRequest({
      headers: this.headers,
      path: `/accounts/${id}/pending`
    })
  }

  /**
   * Returns a list of the most recently placed orders
   *
   * @param {String=} state Filter to only orders of this state e.g. PENDING
   * @param {String=} pair Filter to only orders of this currency pair e.g. XBTZAR
   */
  getOrderList (state, pair) {
    return createRequest({
      headers: this.headers,
      path: '/listorders',
      query: { state, pair }
    })
  }

  /**
   * Create a new trade order.
   *
   * @param {String} type "BID" for a bid (buy) limit order or "ASK" for an ask (sell) limit order
   * @param {String|Number} volume Amount of Bitcoin to buy or sell as a decimal string in units of BTC e.g. "1.423"
   * @param {String|Number} price Limit price as a decimal string in units of ZAR/BTC e.g. "1200".
   * @param {String=} pair The currency pair to trade e.g. XBTZAR
   */
  postOrder (type = '', volume = '', price = '', pair = '') {
    assert(type === 'BID' || type === 'ASK', 'type should be BID or ASK')
    assert(volume, 'volume is required')
    assert(price, 'price is required')

    pair = pair || this.defaultPair

    return createRequest({
      headers: this.headers,
      path: '/postorder',
      data: {
        type,
        volume,
        price,
        pair
      }
    })
  }

  /**
   * Create a new market order.
   *
   * @param {String} type "BUY" to buy bitcoin, or "SELL" to sell bitcoin
   * @param {String} volume For a "BUY" order: amount of local currency (e.g. ZAR, MYR) to spend as a decimal string in units of the local currency e.g. "100.50".
   *                        For a "SELL" order: amount of Bitcoin to sell as a decimal string in units of BTC e.g. "1.423".
   * @param {String} pair The currency pair to trade e.g. XBTZAR
   */
  postMarketOrder (type = '', volume = '', pair) {
    assert(type === 'BUY' || type === 'SELL', 'type should be BUY or SELL')
    assert(volume, 'volume is required')

    pair = pair || this.defaultPair

    const data = {
      type,
      pair
    }

    if (type === 'BUY') {
      data.counter_volume = volume
    } else {
      data.base_volume = volume
    }

    return createRequest({
      headers: this.headers,
      path: '/marketorder',
      data
    })
  }

  /**
   * Request to stop an order.
   *
   * @param {String} id The order reference as a string e.g. BXMC2CJ7HNB88U4
   *
   */
  stopOrder (id = '') {
    assert(id, 'order ID is required')

    return createRequest({
      headers: this.headers,
      path: '/stoporder',
      data: {
        order_id: id
      }
    })
  }

  /**
   * Get an order by its id.
   *
   * @param {String} id The order ID
   *
   * @example
   * client.getOrder(1234).then(console.log).catch(console.log)
   *
   */
  getOrder (id = '') {
    assert(id, 'order ID is required')

    return createRequest({
      headers: this.headers,
      path: `/orders/${id}`
    })
  }

  /**
   * Returns a list of your recent trades for a given pair, sorted by oldest first.
   *
   * @param {Number} since Filter to trades on or after this timestamp, e.g. 1470810728478
   * @param {Number} limit Limit to this number of trades (min 1, max 100, default 100)
   * @param {String=} pair Filter to trades of this currency pair e.g. XBTZAR
   *
   * @example
   * client.getTradesList(new Date('7/7/7'), 50).then(console.log).catch(console.log)
   *
   */
  getTradesList (since, limit, pair) {
    if (since && since instanceof Date) {
      since = since.getTime() / 1000 // Convert to unix timestamp
    }

    pair = pair || this.defaultPair

    return createRequest({
      headers: this.headers,
      path: `/listtrades`,
      query: { pair, since, limit }
    })
  }

  /**
   *
   * Returns the default receive address associated with your account and the amount received via the address.
   * You can specify an optional address parameter to return information for a non-default receive address.
   * In the response, total_received is the total confirmed Bitcoin amount received excluding unconfirmed transactions.
   * total_unconfirmed is the total sum of unconfirmed receive transactions.
   *
   * @param {String} asset Currency code of the asset e.g. XBT
   * @param {String=} address Specific Bitcoin address to retrieve. If not provided, the default address will be used
   *
   * @example
   * client.getReceiveAddress('XBT').then(console.log).catch(console.log)
   */
  getReceiveAddress (asset = '', address) {
    assert(asset, 'asset is required')

    return createRequest({
      headers: this.headers,
      path: '/funding_address',
      query: { asset, address }
    })
  }

  /**
   *
   * Allocates a new receive address to your account.
   * There is a rate limit of 1 address per hour, but bursts of up to 10 addresses are allowed.
   *
   * @param {String} asset Currency code of the asset e.g. XBT
   *
   * @example
   * client.createReceiveAddress('XBT').then(console.log).catch(console.log)
   *
   */
  createReceiveAddress (asset = '') {
    assert(asset, 'asset is required')

    return createRequest({
      headers: this.headers,
      path: '/funding_address',
      data: {
        asset
      }
    })
  }

  /**
   * Returns your fees and 30 day trading volume (as of midnight) for a given pair.
   *
   * @param {String=} pair Filter to trades of this currency pair e.g. XBTZAR
   *
   * @example
   * client.getFeeInfo('XBTZAR').then(console.log).catch(console.log)
   */
  getFeeInfo (pair = '') {
    pair = pair || this.defaultPair

    return createRequest({
      headers: this.headers,
      path: '/fee_info',
      query: { pair }
    })
  }

  /**
   * Returns a list of withdrawal requests.
   *
   * @example
   * client.getWithdrawalRequests().then(console.log).catch(console.log)
   *
   */
  getWithdrawalRequests () {
    return createRequest({
      headers: this.headers,
      path: '/withdrawals'
    })
  }

  /**
   *
   * Creates a new withdrawal request.
   *
   * @param {String} type Withdrawal types e.g. ZAR_EFT, NAD_EFT, KES_MPESA, MYR_IBG, IDR_LLG
   * @param {String|Number} amount Amount to withdraw. The currency depends on the type
   * @param {String=} beneficiaryId The beneficiary ID of the bank account the withdrawal will be paid out to.
   *                                This parameter is required if you have multiple bank accounts.
   *
   * @example
   * client.requestWithdrawal('ZAR_EFT', 1000)
   *
   */
  requestWithdrawal (type = '', amount, beneficiaryId) {
    assert(type, 'type is required')
    assert(amount, 'amount is required')

    const data = {
      type,
      amount
    }

    if (beneficiaryId) {
      data.beneficiary_id = beneficiaryId
    }

    return createRequest({
      headers: this.headers,
      path: '/withdrawals',
      data
    })
  }

  /**
   * Returns the status of a particular withdrawal request.
   *
   * @param {String|Number} id Withdrawal ID to retrieve
   *
   * @example
   * client.getWithdrawalStatus(1234).then(console.log).catch(console.log)
   *
   */
  getWithdrawalStatus (id) {
    assert(id, 'id is required')

    return createRequest({
      headers: this.headers,
      path: `/withdrawals/${id}`
    })
  }

  /**
   * Cancel a withdrawal request. This can only be done if the request is still in state PENDING.
   *
   * @param {String|Number} id 	ID of the withdrawal to cancel
   *
   * @example
   * client.cancelWithdrawalRequest(1234).then(console.log).catch(console.log)
   *
   */
  cancelWithdrawalRequest (id) {
    assert(id, 'id is required')

    return createRequest({
      headers: this.headers,
      path: `/withdrawals/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * Send Bitcoin from your account to a Bitcoin address or email address.
   *
   * @param {String|Number} amount Amount to send as a decimal string
   * @param {String} currency Currency to send e.g. XBT
   * @param {String} address Destination Bitcoin address or email address to send to
   * @param {String=} description Description for the transaction to record on the account statement
   * @param {String=} message Message to send to the recipient. This is only relevant when sending to an email address
   *
   * @example
   * client.send(1000, 'XBT', 'foo@bar.com')
   *
   */
  send (amount = '', currency = '', address = '', description, message) {
    assert(amount, 'amount is required')
    assert(currency, 'currency is required')
    assert(address, 'address is required')

    const data = {
      amount,
      currency,
      address
    }

    if (description) {
      data.description = description
    }

    if (message) {
      data.message = message
    }

    return createRequest({
      headers: this.headers,
      path: '/send',
      data
    })
  }

  /**
   * Creates a new quote to buy or sell a particular amount.
   *
   * @param {String} type Possible types: BUY, SELL
   * @param {String|Number} amount Amount to buy or sell in the pair base currency
   * @param {String=} pair Currency pair to trade e.g. XBTZAR, XBTMYR. The pair can also be flipped if you want to buy or sell the counter currency (e.g. ZARXBT)
   *
   * @example
   * client.createQuote('BUY', 1000).then(console.log).catch(console.log)
   *
   */
  createQuote (type = '', amount = '', pair = '') {
    assert(type === 'BUY' || type === 'SELL', 'type should be BUY or SELL')
    assert(amount, 'amount is required')

    pair = pair || this.defaultPair

    return createRequest({
      headers: this.headers,
      path: '/quotes',
      data: {
        type,
        base_amount: amount,
        pair
      }
    })
  }

  /**
   * Get the latest status of a quote.
   *
   * @param {String} id ID of the quote to retrieve
   *
   * @example
   * client.getQuote(1234).then(console.log).catch(console.log)
   *
   */
  getQuote (id = '') {
    assert(id, 'quote ID is required')
    return createRequest({
      headers: this.headers,
      path: `/quotes/${id}`
    })
  }

  /**
   * Exercise a quote to perform the trade. If there is sufficient balance available in your account, it will be debited and the counter amount credited.
   * An error is returned if the quote has expired or if you have insufficient available balance.
   *
   * @param {String} id ID of the quote to exercise
   *
   * @example
   * client.exerciseQuote(1234).then(console.log).catch(console.log)
   *
   */
  exerciseQuote (id = '') {
    assert(id, 'quote ID is required')
    return createRequest({
      headers: this.headers,
      path: `/quotes/${id}`,
      method: 'PUT'
    })
  }

  /**
   * Discard a quote. Once a quote has been discarded, it cannot be exercised even if it has not expired yet.
   *
   * @param {String} id ID of the quote to discard
   *
   * @example
   * client.discardQuote(1234).then(console.log).catch(console.log)
   */
  discardQuote (id = '') {
    assert(id, 'quote ID is required')
    return createRequest({
      headers: this.headers,
      path: `/quotes/${id}`,
      method: 'DELETE'
    })
  }
}

module.exports = Luno
