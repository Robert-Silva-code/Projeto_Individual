const jwt = require('jsonwebtoken')

function autenticarJWT(req, res, next) {
    const authHeader = req.headers.authorization

    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    const token = tokenFromHeader || req.cookies?.token

    if (!token) {
        return res.status(401).render('login', { titulo: 'Pousada - Login', erro: 'Autentique-se para continuar' })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload
        return next()
    } catch (erro) {
        console.error('Token invalido:', erro.message)
        return res.status(401).render('login', { titulo: 'Pousada - Login', erro: 'Token inválido' })
    }
}

function usuarioOpcional(req, res, next) {
    const token = req.cookies?.token

    if (!token) {
        req.user = null
        return next()
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch (erro) {
        req.user = null
    }
    next()
}

module.exports = { autenticarJWT, usuarioOpcional }