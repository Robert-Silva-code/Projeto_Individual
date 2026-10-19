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

/*
app.get('/', async (req, res) => {
    try{
        const totalUsuarios = await prisma.usuario.count();

        res.send(`Servidor rodando! Total de usuários cadastrados: ${totalUsuarios}`)
    } catch(erro){
        console.error('Erro ao conectar no banco de dados:', erro)
        res.status(500).send('Erro ao conectar no banco de dados')
    }
})
*/

app.get('/', (req, res) => {
    res.render('index', {titulo: 'Pousada - Home'})
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
