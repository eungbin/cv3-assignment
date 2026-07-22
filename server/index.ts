import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.PORT) || 3001

app.disable('x-powered-by')
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const clientDistPath = path.resolve(currentDirectory, '../dist')

if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath))
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) {
      next()
      return
    }

    response.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`API server is running at http://localhost:${port}`)
})
