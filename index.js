require('dotenv').config()
const express = require('express')
const path = require('path')
const app = express()
const port = 3000

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const prisma = require('./lib/prisma')
const logger = require('./middlewares/logger')
const { autenticarJWT, usuarioOpcional } = require('./middlewares/auth')


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(logger)

app.use(usuarioOpcional)
app.use((req, res, next) => {
    res.locals.usuarioLogado = req.user || null
    next()
})

app.use(express.static(path.join(__dirname, 'public')))


app.get('/', (req, res) => {
    res.render('index', {titulo: 'Pousada - Home'})
})

app.get('/login', (req, res) => {
    res.render('login', {titulo: 'Pousada - Login', erro: null})
})

app.get('/cadastro', (req, res) => {
    res.render('cadastro', {titulo: 'Pousada - Cadastro', erro: null})
})

app.get('/reservas', autenticarJWT, async (req, res) => {
    try {
        const reservas = await prisma.reserva.findMany({
            include: {usuario: true, quarto: true}
        })
        res.render('reservas/listar', {titulo: 'Pousada - Reservas', reservas})
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao buscar reservas')
    }
})

app.get('/reservas/criar', autenticarJWT, async (req, res) => {
    try {
        const quartos = await prisma.quarto.findMany({
            where: {disponivel: true}
        })
        res.render('reservas/criar', {titulo: 'Pousada - Criar Reserva', quartos, erro: null})
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao carregar formulário de reserva')
    }
})

app.get('/quartos', autenticarJWT, async (req, res) => {
    try {
        const quartos = await prisma.quarto.findMany({
            orderBy: {numero: 'asc'}
        })
        res.render('quartos/listar', {titulo: 'Pousada - Quartos', quartos, erro: null})
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao carregar quartos')
    }
})

app.post('/login', async (req, res) => {
    const {email, senha} = req.body

    try{
        const usuario = await prisma.usuario.findUnique({
            where: {email}
        })
        if (!usuario){
            return res.render('login', {titulo: 'Pousada - Login', erro: 'Email ou senha inválidos'})
        }
        const senhaValida = await bcrypt.compare(senha, usuario.senha)

        if (!senhaValida){
            return res.render('login', {titulo: 'Pousada - Login', erro: 'Email ou senha inválidos'})
        }
        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )
        res.cookie('token', token, {httpOnly: true})
        if (usuario.tipo === 'admin'){
            return res.redirect('/')
        } else{
            res.redirect('/')
        }
    }catch(erro){
        console.error(erro)
        res.render('login', {titulo: 'Pousada - Login', erro: 'Erro ao processar login'})
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/login')
})

app.post('/cadastro', async (req, res) => {
    const {nome, email, senha, tipo} = req.body

    try{
        const usuarioExistente = await prisma.usuario.findUnique({
            where: {email}
        })
        if (usuarioExistente){
            return res.render('cadastro', {titulo: 'Pousada - Cadastro', erro: 'Email já cadastrado'})
        }
        const senhaHash = await bcrypt.hash(senha, 12)
        await prisma.usuario.create({
            data: {
                nome, 
                email, 
                senha: senhaHash, 
                tipo: tipo || 'Hospede'}
        })
        res.redirect('/login')
    } catch (erro) {
        console.error(erro)
        res.render('cadastro', {titulo: 'Pousada - Cadastro', erro: 'Erro ao processar cadastro'})
    }
})

app.post('/quartos', autenticarJWT, async (req, res) => {
    const {numero, tipo, precoDiaria, disponivel } = req.body

    try {
        const quartoExistente = await prisma.quarto.findUnique({
            where: { numero: parseInt(numero) }
        })
        
        if (quartoExistente) {
            const quartos = await prisma.quarto.findMany({
                orderBy: { numero: 'asc' }
            })
            return res.render('quartos/listar', { titulo: 'Pousada - Quartos', quartos, erro: 'Número de quarto já cadastrado' })
        }

        await prisma.quarto.create({
            data: {
                numero: parseInt(numero),
                tipo,
                precoDiaria: parseFloat(precoDiaria),
                disponivel: disponivel === 'true' || disponivel === 'on'
            }
        })
        res.redirect('/quartos')
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao criar quarto')
    }
})

app.get('/quartos/editar/:id', autenticarJWT, async (req, res) => {
    const { id } = req.params

    try {
        const quarto = await prisma.quarto.findUnique({ where: { id } })
        if (!quarto) return res.redirect('/quartos')

        res.render('quartos/editar', { titulo: 'Pousada - Editar Quarto', quarto })
    } catch (erro) {
        console.error(erro)
        res.redirect('/quartos')
    }
})


app.post('/quartos/editar/:id', autenticarJWT, async (req, res) => {
    const { id } = req.params
    const {numero, tipo, precoDiaria, disponivel } = req.body

    try {
        await prisma.quarto.update({
            where: {id},
            data: {
                numero: parseInt(numero),
                tipo,
                precoDiaria: parseFloat(precoDiaria),
                disponivel: disponivel === 'true' || disponivel === 'on'
            }
        })
        res.redirect('/quartos')
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao atualizar quarto')
    }
})

app.post('/quartos/excluir/:id', autenticarJWT, async (req, res) => {
    const { id } = req.params

    try{
        await prisma.quarto.delete({ where: { id } })
        res.redirect('/quartos')
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao excluir quarto')
    }
})


app.get('/reservas/criar', autenticarJWT, async (req, res) => {
    try {
        const quartos = await prisma.quarto.findMany({
            where: {disponivel: true},
            orderBy: {numero: 'asc'}
        })
        res.render('reservas/criar', {titulo: 'Pousada - Criar Reserva', quartos, erro: null})
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao carregar quartos disponíveis')
    }
})

app.post('/reservas/criar', autenticarJWT, async (req, res) => {
    const {quartoId, dataEntrada, dataSaida} = req.body
    const usuarioId = req.user.id

    try {
        const quarto = await prisma.quarto.findUnique({ where: { id: quartoId } })

        if (!quarto) {
            const quartos = await prisma.quarto.findMany({
                where: {disponivel: true}
            })
            return res.render('reservas/criar', {titulo: 'Pousada - Criar Reserva', quartos, erro: 'Quarto não encontrado'})
        }

        const inicio = new Date(dataEntrada)
        const fim = new Date(dataSaida)
        const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))

        if (dias <= 0) {
            const quartos = await prisma.quarto.findMany({
                where: {disponivel: true}
            })
            return res.render('reservas/criar', {titulo: 'Pousada - Criar Reserva', quartos, erro: 'Data de saída deve ser posterior à data de entrada'})
        }
        
        const valorTotal = dias * quarto.precoDiaria

        await prisma.reserva.create({
            data: {
                usuarioId,
                quartoId,
                dataEntrada: inicio,
                dataSaida: fim,
                valorTotal,
                status: 'Confirmada'
            }
        })

        await prisma.quarto.update({
            where: { id: quartoId },
            data: { disponivel: false}
        })
        res.redirect('/reservas')
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao criar reserva')
    }
})

app.post('/reservas/excluir/:id', autenticarJWT, async (req, res) => {
    const { id } = req.params

    try {
        const reserva = await prisma.reserva.findUnique({ where: { id } })

        if (reserva) {
            await prisma.quarto.update({
                where: { id: reserva.quartoId },
                data: { disponivel: true }
            })

            await prisma.reserva.delete({ where: { id } })
        }
        res.redirect('/reservas')
    } catch (erro) {
        console.error(erro)
        res.status(500).send('Erro ao excluir reserva')
    }
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
