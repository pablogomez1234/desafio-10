const express = require('express')
const passport = require('passport')
require('../middlewares/auth')

const { Router } = express   
const sessionRouter = Router() 



/* ------------------ router session ----------------- */
//--------------------- usuario logeado?
sessionRouter.get('/', (req, res) => {
  if (req.session.passport) {
    console.log (req.session)
    //req.session.cookie._expires = new Date(Date.now() + 60000)
    //req.session.save()
    res.status(200).send({ user: req.session.passport.user })
  } else {
    res.status(401).send({ user: '' })
  }
})


//--------------------- post login user
sessionRouter.post(
  '/login', 
  passport.authenticate('login'),
  function(req, res) {
     res.status(200).send({ message: 'Autenticación exitosa.' })
  }
)

//--------------------- post login/register user with google
sessionRouter.post(
  '/logingoogle', 
  passport.authenticate('googleauth'),
  function(req, res) {
    res.status(200).send({ message: 'Autenticación exitosa.' })
  }
)


//--------------------- post Register user
sessionRouter.post(
  '/register',
  passport.authenticate('register'),
  function(req, res) {
    res.status(200).send({ rlt: true, msg: 'Usuario creado correctamente'})
  }
)


//------------ get cerrar sesion
sessionRouter.post('/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send(`Something terrible just happened!!!`)
    } else {
      res.redirect('/')
    }
  })
})


module.exports = sessionRouter