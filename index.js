'use strict'

const assert = require('assert')

const fetch = require('node-fetch')
const qs = require('qs')
const stringify = require('fast-safe-stringify')

const BASE_URL = 'https://api.mybitx.com/api/1'

function createRequest ({ path, headers, query, data } = {}) {
  const opts = {
    headers,
    method: data ? 'POST' : 'GET'
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

    return { error: { status: res.status, message: res.statusText } }
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
   * @param {*} currency The currency code for the account you want to create e.g. XBT, IDR, MYR, ZAR
   */
  createAccount (name = '', currency = 'ZAR') {
    return createRequest({
      headers: this.headers,
      path: '/accounts',
      data: { currency, name }
    })
  }

  /**
   * Return the list of all accounts and their respective balances.
   */
  getBalances () {
    return createRequest({
      headers: this.headers,
      path: '/balance'
    })
  }

  /**
   * Return a list of transaction entries from an account.
   *
   * @param {String|Number} id Account ID
   * @param {String|Number} minRow Minimum of the row range to return (inclusive)
   * @param {String|Number} maxRow Maximum of the row range to return (exclusive)
   */
  getTransactions (id = '', minRow = 1, maxRow = 100) {
    assert(id, 'account ID is required')

    return createRequest({
      headers: this.headers,
      path: `/accounts/${id}/transactions`,
      query: { minRow, maxRow }
    })
  }

  /**
   * Return a list of all pending transactions related to the account.
   *
   * @param {String|Number} id Account ID
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
   * @param {String} state Filter to only orders of this state e.g. PENDING
   * @param {String} pair Filter to only orders of this currency pair e.g. XBTZAR
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
   * @param {String} volume Amount of Bitcoin to buy or sell as a decimal string in units of BTC e.g. "1.423"
   * @param {*} price Limit price as a decimal string in units of ZAR/BTC e.g. "1200".
   * @param {*} pair The currency pair to trade e.g. XBTZAR
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
   * @param {*} pair Filter to trades of this currency pair e.g. XBTZAR
   */
  getTradesList (since, limit, pair) {
    pair = pair || this.defaultPair
    return createRequest({
      headers: this.headers,
      path: listtrades,
      query: { pair, since, limit }
    })
  }
}

module.export = Luno
