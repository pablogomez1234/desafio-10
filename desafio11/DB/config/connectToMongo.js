const mongoose = require('mongoose')

let isConected

const connectToDd = async () => {
  if(!isConected) { // Esta logica es para evitar varias conexiones simultaneas
    mongoose.set('strictQuery', true)
    await mongoose.connect(process.env.MONGOCREDENTIALSECOMMERCE,
    { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
          isConected = true
          console.log('MongoDB Connected...')})
        .catch(err => console.log(err))   
    return
  }

  console.log("Conexion existente")
  return
}

module.exports = connectToDd 

