const Luno = require('./index')

const options = {
  key: process.env.LUNO_KEY,
  secret: process.env.LUNO_SECRET
}

test('should be defined', () => {
  expect(Luno).toBeDefined()
})

// test('should return new Luno client instance', () => {
//   const client = new Luno(options)
//   expect(client.getTicker).toBeDefined()
// })
