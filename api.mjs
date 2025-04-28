import jotform from '@wojtekmaj/jotform';
import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import staffRoute from './routes/staffRoute.mjs'
import medicationsRoute from './routes/medicationsRoute.mjs'
import hospitalsRoute from './routes/hospitalsRoute.mjs'
import consultantRoute from './routes/medicationsConsRoute.mjs'

const ORIGIN_URL = process.env.ORIGIN_URL

const app = express();

const allowedOrigins = {
  development: 'http://localhost:5173',
  production: 'https://access-jsongenerator-1.onrender.com'
}

const environment = process.env.NODE_ENV || 'development';

console.log(environment)

const corsOptions = {
  origin: allowedOrigins[environment],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}

app.use(cors(corsOptions));
//app.options('*', cors())

/**
 * Declare routes
 */
app.use('/api', staffRoute)
app.use('/api', medicationsRoute)
app.use('/api', hospitalsRoute)
app.use('/api', consultantRoute)

jotform.options({
  apiKey: process.env.JOTFORM_API,
  url: "https://eu-api.jotform.com"
})

app.listen(3001, () => {
  console.log(`Server listening on port 3001`)
})
