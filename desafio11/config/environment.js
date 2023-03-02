//-------------- Minimist
const parseArgs = require('minimist')(process.argv.slice(2))
const config = {
  port: parseArgs.p
}


//--------------- DotEnv
require('dotenv').config()
const staticFiles = process.env.STATICFILES



//-------------- Exports
module.exports = { config, staticFiles }