const express = require('express') // Express web framework https://expressjs.com/
const app = express() // Framework variable
const hbs = require('hbs') // Express view engine wrapper for Handlebars https://github.com/pillarjs/hbs
const request = require('request') // Request - Simplified HTTP client https://github.com/request/request
const bodyParser = require('body-parser') // Node.js body parsing middleware
const config = require('./config.js') // Configuration parameters

app.set('view engine', 'hbs') // Set view engine
app.use(bodyParser.urlencoded({extended:false})) // Parser for post elements

/**
 * Json control
 * @param str string
 * @return boolean
 */
var IsJsonString = (str) => {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

/**
 * fahrenheit celcius convert
 * @param deg float
 * @return float
 */
var fahrenheitToCelcius = (deg) => parseFloat((deg - 32) * 5 / 9 ).toFixed(2)

var errorMessage = {"error":"An unexpected error occurred. Please try again later."}

/**
 * Returns user information by user ip from http://ip-api.com
 * 150 requests per minute allowed
 * for more information visit http://ip-api.com/docs/
 * @return object json
 */
app.post('/location', (req, res) => {

  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress // get user ip

  request(`http://ip-api.com/json/${ip}`, (error, response, body) => {

    if(error) return res.json(errorMessage)

    // json output check
    if ( IsJsonString(body) ){
      body = JSON.parse(body)
      if(response && response.statusCode === 200 && body.status === 'success') return res.json(body)
    }

    return res.json(errorMessage)

  })

})

/**
 * Returns weather information by latitude and longitude from https://darksky.net/dev
 * Trial account allows up to 1000 free calls per day
 * @return object json
 */
app.post('/weather', (req, res) => {

  var lat = parseFloat(req.body.lat), lon = parseFloat(req.body.lon)

  if( ! lat && ! lon ) return res.json({"error": "Please provide latitude and longitude."})

  request({
    url: `https://api.darksky.net/forecast/${config.weatherSecretKey}/${lat},${lon}`,
    json: true,
  }, (error, response, body) => {

    if (error) return res.json(errorMessage)

    if( response.statusCode === 200 )
      return res.json({
        temparature: fahrenheitToCelcius(body.currently.temperature),
        apparentTemparature: fahrenheitToCelcius(body.currently.apparentTemperature),
      })

    return res.json({"error": "Unable to fetch weather."})

  })

})

/**
 * Home page
 * @return text/html
 */
app.get('/', (req, res) => {
  return res.render('index.hbs', {
    googleApiKey: config.googleApiKey
  })
})

app.listen(config.port, () => {console.log(`Weather Application started. Please visit http://127.0.0.1:${config.port}`)})
