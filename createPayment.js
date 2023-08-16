const axios = require('axios').default

exports.createFormToken = async paymentConf => {
  // format: 123456789
  const username = '14245093'

  // format: testprivatekey_XXXXXXX
  const password = 'testpassword_6JpDLl2tGvCShpS1tJWXHV6sVPJpLiCGOUAzvkJtl2HZk'

  // format: api.my.psp.domain.name without https
  const endpoint = 'api.micuentaweb.pe'

  const createPaymentEndpoint = `https://${username}:${password}@${endpoint}/api-payment/V4/Charge/CreatePayment`

  try {
    const response = await axios.post(createPaymentEndpoint, paymentConf, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response?.data?.answer?.formToken) throw response
    return response.data.answer.formToken
  } catch (error) {
    throw error
  }
}
