const Luno = require('./index')

const options = {
  key: process.env.LUNO_KEY,
  secret: process.env.LUNO_SECRET
}

test('should be defined', () => {
  expect(Luno).toBeDefined()
})

test('should return new Luno client instance', () => {
  const client = new Luno(options)
  expect(client.getTicker).toBeDefined()
  expect(client.getBalances).toBeDefined()
})

test('should get latest ticker indicators', async () => {
  const client = new Luno(options)
  const ticker = await client.getTicker()

  expect(typeof ticker).toBe('object')
  expect(ticker.timestamp).toBeDefined()
})

test('should get latest ticker indicators from all active Luno exchanges', async () => {
  const client = new Luno(options)
  const tickers = await client.getAllTickers()

  expect(typeof tickers).toBe('object')
  expect(tickers.tickers).toBeDefined()
  expect(Array.isArray(tickers.tickers)).toBe(true)
})

test('should get balances', async () => {
  const client = new Luno(options)
  const balances = await client.getBalances()

  expect(typeof balances).toBe('object')
})

test('should get a list of bids and asks in the order book', async () => {
  const client = new Luno(options)
  const orderBook = await client.getOrderBook()

  expect(typeof orderBook).toBe('object')
  expect(orderBook.bids).toBeDefined()
  expect(Array.isArray(orderBook.bids)).toBe(true)
})

test('should get a list of the most recent trades', async () => {
  const client = new Luno(options)
  const trades = await client.getTrades()

  expect(typeof trades).toBe('object')
  expect(trades.trades).toBeDefined()
  expect(Array.isArray(trades.trades)).toBe(true)
})
