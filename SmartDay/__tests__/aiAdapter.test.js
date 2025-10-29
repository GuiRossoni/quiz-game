const aiAdapter = require('../src/helpers/aiAdapter')

describe('aiAdapter.generateQuestions', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    process.env.N8N_WEBHOOK_URL = 'https://example.com/webhook'
    process.env.AI_PROVIDER = 'cohere'
  })

  afterEach(() => {
    process.env = OLD_ENV
    delete global.fetch
  })

  test('Resposta válida do n8n', async () => {
    const fakeResponse = [
      {
        question: 'Q1',
        topic: 'JavaScript',
        answers: ['a','b','c','d'],
        correctAnswer: 'a'
      },
      {
        question: 'Q2',
        topic: 'Python',
        answers: ['a','b','c','d'],
        correctAnswer: 'b'
      }
    ]

    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(fakeResponse) }))

    const result = await aiAdapter.generateQuestions({ topics: ['JavaScript', 'Python'], prompt: 'x' })
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].question).toBe('Q1')
    expect(result[0].answers.length).toBe(4)
  })

  test('Quando a resposta é inválida', async () => {
    const badResponse = [{ foo: 'bar' }]
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(badResponse) }))

    await expect(aiAdapter.generateQuestions({ topics: ['X'], prompt: 'x' })).rejects.toThrow('Falha de validação das perguntas analisadas')
  })

  test('Falha de rede', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network')))
    await expect(aiAdapter.generateQuestions({ topics: ['X'], prompt: 'x' })).rejects.toThrow()
  })
})
