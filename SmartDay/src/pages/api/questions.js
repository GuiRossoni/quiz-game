import offlineQuestions from '@/assets/questions.json'
const aiAdapter = require('@/helpers/aiAdapter')

function defaultPromt () {
	const topics = Object.keys(offlineQuestions)
	const random3Topics = topics.sort(() => Math.random() - Math.random()).slice(0, 3)
	const randomQuestions = random3Topics.map(topic => {
		const randomQuestion = {
			...offlineQuestions[topic][Math.floor(Math.random() * offlineQuestions[topic].length)],
			topic
		}
		return randomQuestion
	})

	const text = randomQuestions.reduce((acc, question, index) => {
		const questionText = `question: ${question.question}\ntopic: ${question.topic}\n${question.answers.map(answer => `-${answer}`).join('\n')}\ncorrect: ${question.correctAnswer}\n\n`
		if (index === randomQuestions.length - 1) return acc + questionText.slice(0, -1)
		return acc + questionText
	}, '')

	return 'Gere três perguntas, ' + random3Topics.map(topic => `1 sobre ${topic}`).join(', ') + '. Cada pergunta tem 4 respostas (1 correta e 3 incorretas).\n---\n' + text + '---\n'
}

export default function handler (req, res) {
	if (req.method !== 'POST') return res.status(405).json({ message: 'Somente requisições POST são permitidas', statusCode: 405 })
	if (!req.body.topics) return res.status(400).json({ message: 'Os tópicos são obrigatórios', statusCode: 400 })

	const promt = `${defaultPromt()}${defaultPromt()}Gere 3 perguntas, ${req.body.topics.map(topic => `1 sobre ${topic}`).join(', ')}. Cada pergunta tem 4 respostas (1 correta e 3 incorretas).\n---`

	// Timeout de 10 segundos para fallback offline + guarda de responded para evitar respostas duplas
	let responded = false
	const timeout = setTimeout(() => {
		if (responded) return
		responded = true
		try {
			const availableTopics = Object.keys(offlineQuestions)
			const requested = Array.isArray(req.body.topics) ? req.body.topics : []
			const validRequested = requested.filter(t => availableTopics.includes(t))
			const pickFrom = validRequested.length ? validRequested : availableTopics
			const random3Topics = pickFrom.sort(() => Math.random() - Math.random()).slice(0, 3)
			const randomQuestions = random3Topics.map(topic => {
				const pool = offlineQuestions[topic] || offlineQuestions[availableTopics[Math.floor(Math.random() * availableTopics.length)]]
				const randomQuestion = {
					...pool[Math.floor(Math.random() * pool.length)],
					topic
				}
				return randomQuestion
			})
			return res.status(200).json(randomQuestions)
		} catch (err2) {
			console.log('Offline fallback failed', err2)
			return res.status(500).json({ message: 'Algo deu errado', statusCode: 500 })
		}
	}, 10 * 1000)

	aiAdapter.generateQuestions({ topics: req.body.topics, prompt: promt })
		.then(parsedQuestions => {
			if (responded) return
			responded = true
			clearTimeout(timeout)
			return res.status(200).json(parsedQuestions)
		})
		.catch(err => {
			if (responded) return
			responded = true
			clearTimeout(timeout)
			console.log('AI adapter error:', err.message || err)
			// Fallback offline: escolha 3 tópicos aleatórios e retorne 3 perguntas
			try {
				const availableTopics = Object.keys(offlineQuestions)
				const requested = Array.isArray(req.body.topics) ? req.body.topics : []
				const validRequested = requested.filter(t => availableTopics.includes(t))
				const pickFrom = validRequested.length ? validRequested : availableTopics
				const random3Topics = pickFrom.sort(() => Math.random() - Math.random()).slice(0, 3)
				const randomQuestions = random3Topics.map(topic => {
					const pool = offlineQuestions[topic] || offlineQuestions[availableTopics[Math.floor(Math.random() * availableTopics.length)]]
					const randomQuestion = {
						...pool[Math.floor(Math.random() * pool.length)],
						topic
					}
					return randomQuestion
				})
				return res.status(200).json(randomQuestions)
			} catch (err2) {
				console.log('Offline fallback failed', err2)
				return res.status(500).json({ message: 'Algo deu errado', statusCode: 500 })
			}
		})
}
