const express = require('express')
const app = express()
const port = 3000

const prisma = require('./lib/prisma')

app.get('/', (req, res) => {
    res.json({ message: 'Yiippeeee!' })
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
