const express = require('express')
const { products } = require('../class/productContainer')
const { mock5 } = require('../class/mockFaker')
const { fork } = require('child_process')

const { Router } = express   
const productRouter = Router() 



/* ------------------ router productos ----------------- */
//------------- get productos
productRouter.get('/productos', async (_, res) => {
  const allProducts = await products.getAll()
  res.json( allProducts )
})


//------------ get producto segun id
productRouter.get('/productos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const product = await products.getById( id )
  product ? res.json( product )
    : res.status(404).send({ error: 'producto no encontrado'})
})


//--------------------- post producto
productRouter.post('/productos', async (req, res) => {
  const productToAdd = req.body
  await products.add( productToAdd )
  res.redirect('/')
})


//---------------------- put producto
productRouter.put('/productos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const productToModify = req.body

  if(await products.modifyById( id, productToModify )){
    res.send({ message: 'producto modificado'})
  } else {
    res.status(404).send({ error: 'producto no encontrado'})
  }
})


//------------------------- delete producto
productRouter.delete('/productos/:id', async (req, res) => {
  const id = req.params.id
  if (await products.deleteById(id)) {
    res.send({ message: 'producto borrado'})
  } else {
    res.status(404).send({ error: 'producto no encontrado'})
  }
}) 



//---------------- get Test
//------------- get productos
productRouter.get('/productos-test', async (req, res) => {
  const allProducts = await mock5.getAll()

  let tabla = '<table>'
  tabla += '<tr><th>Producto</th><th>Precio</th><th>Imagen</th></tr>'
  allProducts.forEach((fila) => {
    tabla += `<tr>
                <td>${fila.title}</td>
                <td>${fila.price}</td>
                <td><img src="${fila.thumbnail}" alt="${fila.title}" width="64" heigth="48"></td>
              </tr>`
  })
  tabla += '</table>'

  res.send(tabla)

})


//---------------- get Randoms numbers
productRouter.get('/randoms', async (req, res) => {
  
  const numbers = req.query.cant || 10000000
  const randomNumbersProcess = fork('./api/randomNumbers.js')
  
 
  randomNumbersProcess.on('message', (counts) => {
    res.json(counts)
  })

  randomNumbersProcess.send({ numbers: numbers })
})




module.exports = productRouter