const DEFAULT_TIMEOUT = 9 * 1000 // permite que o timeout no chamador seja um pouco maior

function validateQuestion (q) {
	if (!q || typeof q !== 'object') return false
	if (!q.question || typeof q.question !== 'string') return false
	if (!q.topic || typeof q.topic !== 'string') return false
	if (!Array.isArray(q.answers) || q.answers.length !== 4) return false
	if (!q.correctAnswer || typeof q.correctAnswer !== 'string') return false
	return true
}

async function fetchWithTimeout (url, options = {}, timeout = DEFAULT_TIMEOUT) {
	const controller = new AbortController()
	const id = setTimeout(() => controller.abort(), timeout)
	try {
		const res = await fetch(url, { ...options, signal: controller.signal })
		return res
	} finally {
		clearTimeout(id)
	}
}

/**
 * generateQuestions - Chama um webhook n8n que detém segredos e delega para Cohere/OpenAI
 * params: { topics: string[], prompt?: string }
 * returns: Question[] validada com shape { question, answers[4], correctAnswer, topic }
 */
async function generateQuestions ({ topics, prompt } = {}) {
	const webhook = process.env.N8N_WEBHOOK_URL
	const provider = (process.env.AI_PROVIDER || 'cohere').toLowerCase()

	if (!Array.isArray(topics) || topics.length === 0) {
		throw new Error('Os tópicos devem ser um array não vazio')
	}

	// Se nenhum webhook for fornecido, falhe rapidamente e permita que o chamador faça fallback para offline
	if (!webhook) {
		throw new Error('N8N_WEBHOOK_URL não configurado')
	}

	const body = JSON.stringify({ provider, topics, prompt })

	let res
	try {
		res = await fetchWithTimeout(webhook, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body
		})
	} catch (err) {
		throw new Error('A requisição para o webhook n8n falhou ou excedeu o tempo limite')
	}

	if (!res.ok) {
		const txt = await res.text().catch(() => '')
		throw new Error(`n8n webhook retornou ${res.status}: ${txt}`)
	}

	let data
	try {
		data = await res.json()
	} catch (err) {
		throw new Error('JSON inválido do webhook n8n')
	}

	// Espera que data seja um array de perguntas
	if (!Array.isArray(data)) {
		throw new Error('n8n webhook retornou formato inesperado')
	}

	const parsed = data.map(item => ({
		question: item.question,
		answers: item.answers,
		correctAnswer: item.correctAnswer,
		topic: item.topic,
		userAnswer: undefined,
		ia: true
	}))

	// Valida todos
	const allValid = parsed.every(validateQuestion)
	if (!allValid) throw new Error('Falha de validação das perguntas analisadas')

	return parsed
}

module.exports = {
	generateQuestions,
	// exporta para testes
	_validateQuestion: validateQuestion
}
