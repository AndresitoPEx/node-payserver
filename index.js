const express = require('express');
const cors = require('cors');
const { createFormToken } = require('./createPayment');
const morgan = require('morgan');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const app = express();
const port = 2000;

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

/**
 * Validates the given payment data (hash)
 */
app.post('/validatePayment', (req, res) => {
  const answer = req.body.clientAnswer;
  const hash = req.body.hash;
  const answerHash = Hex.stringify(
    hmacSHA256(JSON.stringify(answer), '40hE0bHKAQPGZZyyM74W0XnY8SWqIynq6xdrLG6GgTbCS')
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

  // Verify the hash
  const receivedHash = req.headers['hash'];
  const computedHash = Hex.stringify(hmacSHA256(JSON.stringify(req.body), '40hE0bHKAQPGZZyyM74W0XnY8SWqIynq6xdrLG6GgTbCS'));

  console.log('Received body:', JSON.stringify(req.body));
  console.log('Received hash:', receivedHash);
  console.log('Received hash:', req.headers['hash']);


  if (receivedHash !== computedHash) {
    return res.status(400).send('Hash mismatch');
  }

  // Process the notification
  const transactionStatus = req.body.status;
  // Update the transaction status in your database

  // Respond to the notification
  res.status(200).send('OK');

  console.log('Calculated hash:', computedHash);
  console.log('Transaction status:', transactionStatus);
  
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});




app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
