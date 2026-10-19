const express = require('express')
const path = require('path')
const app = express()
const port = 3000

const prisma = require('./lib/prisma')


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, 'public')))


app.get('/', (req, res) => {
    res.render('index', {titulo: 'Pousada - Home'})
})

app.get('/login', (req, res) => {
    res.render('login', {titulo: 'Pousada - Login'})
})

app.post('/login', async (req, res) => {
    const {email, senha} = req.body

    try{
        await prisma.usuario.findUnique()
    }
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
