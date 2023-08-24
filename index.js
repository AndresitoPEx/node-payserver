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
  // Log all received headers and body for debugging
  console.log('Received headers:', req.headers);
  console.log('Received body:', JSON.stringify(req.body));

  // Extract the key from the body
  const secretKeyFromRequestBody = req.body['kr-hash-key'];

  // Verify the hash using the key from the body
  const receivedHash = req.body['kr-hash'];
  
  // Use the same method to calculate the hash as in /validatePayment
  const computedHash = Hex.stringify(
    hmacSHA256(JSON.stringify(req.body['kr-answer']), secretKeyFromRequestBody)
  );

  console.log('Calculated hash:', computedHash);

  if (receivedHash === computedHash) {
    // Process the notification
    const transactionStatus = req.body.status;
    // Update the transaction status in your database

    console.log('Transaction status:', transactionStatus);
    // Respond to the notification
    res.status(200).send('OK');
  } else {
    return res.status(400).send('Hash mismatch');
  }
});






app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
