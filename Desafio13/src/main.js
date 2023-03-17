/* Consigna: 
----------------------------------------------------------------------------------
- Usar Compressor en /INFO
----------------------------------------------------------------------------------
- Usar Log4js con:
    Ruta y método de todas las peticiones recibidas por el servidor (info)
    Ruta y método de las peticiones a rutas inexistentes en el servidor (warning)
    Errores lanzados por las apis de mensajes y productos, únicamente (error)
  Considerar el siguiente criterio:
    Loggear todos los niveles a consola (info, warning y error)
    Registrar sólo los logs de warning a un archivo llamada warn.log
    Enviar sólo los logs de error a un archivo llamada error.log
----------------------------------------------------------------------------------
-Realizar el análisis completo de performance del servidor con el que venimos trabajando.
  Vamos a trabajar sobre la ruta '/info', en modo fork, agregando ó extrayendo un console.log de la información
  colectada antes de devolverla al cliente. Además desactivaremos el child_process de la ruta '/randoms'
  
  Para ambas condiciones (con y sin console.log) en la ruta '/info' OBTENER:
    1) El perfilamiento del servidor, realizando el test con --prof de node.js. Analizar los resultados obtenidos luego de procesarlos con --prof-process. 
      Utilizaremos como test de carga Artillery en línea de comandos, emulando 50 conexiones concurrentes con 20 request por cada una.
      Extraer un reporte con los resultados en archivo de texto.
      Luego utilizaremos Autocannon en línea de comandos, emulando 100 conexiones concurrentes realizadas en un tiempo de 20 segundos.
      Extraer un reporte con los resultados (puede ser un print screen de la consola)
    2) El perfilamiento del servidor con el modo inspector de node.js --inspect. Revisar el tiempo de los procesos menos performantes sobre el archivo fuente de inspección.
    3) El diagrama de flama con 0x, emulando la carga con Autocannon con los mismos parámetros anteriores.

  Realizar un informe en formato pdf sobre las pruebas realizadas incluyendo los resultados de todos los test (texto e imágenes). 
  Al final incluir la conclusión obtenida a partir del análisis de los datos.
-----------------------------------------------------------------------------------------
*/

const { config, staticFiles } = require('../config/environment')
const express = require('express')

//const compression = require('compression')
const { logger, loggererr } = require('../log/logger')

//--- Para servidor FORK & CLUSTER
const cluster = require('cluster')
const numCPUs = require('os').cpus().length


//-------------------------- PROCESO BASE INICIO -------------------------------  
//------------------------------------------------------------------------------
const baseProcces = () => {

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Proceso ${worker.process.pid} caido!`)
    cluster.fork()
  })

  //--- Servicios Express
  const expressSession = require('express-session')
  const { Server: HttpServer } = require('http')
  const { Server: Socket } = require('socket.io')
  const app = express()
  const httpServer = new HttpServer(app)
  const io = new Socket(httpServer)

  //--- Routes
  const productRouter = require('../routes/productRouter')
  const sessionRouter = require('../routes/sessionRouter')
  const infoRouter = require('../routes/infoRouter')

  //--- Databases
  const MongoStore = require('connect-mongo')
  const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }

  //--- Objetos locales
  const { products } = require('../class/productContainer')
  const { chats } = require('../class/chatContainer')

  //--- Middlewares
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(staticFiles))
  app.use(expressSession({
    store: MongoStore.create({
      mongoUrl: process.env.MONGOCREDENTIALSESSION,
      mongoOptions: advancedOptions
    }),
    secret: 'secret-pin',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60000
    }
  }))
  
  //app.use(compression())

  
  //--- SOCKET
  io.on('connection', async socket => {
    console.log('Nuevo cliente conectado!')

    //-- Tabla inicial al cliente
    socket.emit('productos', await products.getAll())
 
    //-- Nuevo producto desde cliente
    socket.on('update', async producto => {
      await products.add( producto )
      io.sockets.emit('productos', await products.getAll())
    })
  
    //-- Chat inicial al cliente
    socket.emit('mensajes', await chats.getAll())

    //-- Nuevo mensaje desde el cliente
    socket.on('newMsj', async mensaje => {
      mensaje.date = new Date().toLocaleString()
      await chats.add( mensaje ) 
      io.sockets.emit('mensajes', await chats.getAll())
    })

  })


  //--- ROUTES
  //--- SESSION ROUTER 
  app.use('/session', sessionRouter)

  //--- API REST ROUTER 
  app.use('/api', productRouter)

  //--- INFO ROUTER
  app.use('/info', infoRouter)

  //--- Rutas no implementadas
  app.get('*', (req, res) => {
    logger.warn(`Ruta: ${req.url}, metodo: ${req.method} no implemantada`)
    res.send(`Ruta: ${req.url}, metodo: ${req.method} no implemantada`)
  })


  //--- SERVER ON
  let PORT = ( config.port) ? config.port : 8080 // puerto por defecto 8080

  if ( config.mode === 'CLUSTER') { // para CLUSTER si la clave same es 1 crea un puerto para cada worker
    PORT = config.same === 1 ? PORT + cluster.worker.id - 1 : PORT
  } 

  const server = httpServer.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${server.address().port}`)
  })
  server.on('error', error => loggererr.error(`Error en servidor ${error}`))
  
}
//------------------------------ PROCESO BASE FIN -----------------------------------  
//-----------------------------------------------------------------------------------



//---------------------------- LOGICA CLUSTER / FORK  -------------------------------

if ( config.mode != 'CLUSTER' ) { 

  //-- Servidor FORK
  console.log('Server en modo FORK')
  console.log('-------------------')
  baseProcces()
  } else { 

    //-- Servidor CLUSTER   
    if (cluster.isPrimary) {
      console.log('Server en modo CLUSTER')
      console.log('----------------------')
      for (let i = 0; i < numCPUs; i++) { // creo tantos procesos como cpus tengo
        cluster.fork()
      }
    } else {
      baseProcces()
    }
  }




