require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createFormToken } = require('./createPayment');
const morgan = require('morgan');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const app = express();
const port = process.env.PORT || 2000; // Use environment variable for port if available


app.use(morgan('dev'));

// // IP Authorization
// app.use((req, res, next) => {
//   const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//   const ipRange = '194.50.38.'; // Approximation to the range 194.50.38.0/24

//   if (clientIp.startsWith(ipRange)) {
//     next(); // Authorized IP, continue to the next middleware
//   } else {
//     res.status(403).send('Unauthorized IP'); // Unauthorized IP
//   }
// });

app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Funciona');
});

/**
 * Generates a payment token for the given configuration
 */
app.post('/createPayment', async (req, res) => {
  const paymentConf = req.body.paymentConf;

  try {
    console.log('Received paymentConf:', paymentConf);
    const formToken = await createFormToken(paymentConf);
    console.log('Generar formToken:', formToken);
    res.send(formToken);
  } catch (error) {
    console.error('Error formToken', error);
    res.status(500).send(error.data);
  }
});

const SECRET_KEY = process.env.SECRET_KEY || 'your_default_secret_key';
/**
 * Validates the given payment data (hash)
 */
app.post('/validatePayment', (req, res) => {
  const answer = req.body.clientAnswer;
  const hash = req.body.hash;
  const answerHash = Hex.stringify(
    hmacSHA256(JSON.stringify(answer), SECRET_KEY)
  );

  console.log('Received clientAnswer:', answer);
  console.log('Received hash:', hash);
  console.log('Calculated answerHash:', answerHash);

  if (hash === answerHash) {
    console.log('Payment is valid');
    res.status(200).send('Valid payment');
  } else {
    console.log('Payment hash mismatch');
    res.status(500).send('Payment hash mismatch');
  }
});

// IPN Endpoint
app.post('/ipn', (req, res) => {
  const answer = JSON.parse(req.body["kr-answer"]);
  const hash = req.body["kr-hash"];

  const answerHash = Hex.stringify(
    hmacSHA256(JSON.stringify(answer), PUBLIC_PASSWORD) // Changed keys.password to SECRET_KEY
  );

  console.log(answerHash);
  console.log(hash);

  if (hash === answerHash)
    res.status(200).send({ 'response': answer.orderStatus });
  else
    res.status(500).send({ 'response': 'Error catastrófico, puede estar teniendo un intento de fraude' });
});




app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
