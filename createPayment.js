const axios = require('axios').default

exports.createFormToken = async paymentConf => {
  // format: 123456789
  const username = '14245093'

  // format: testprivatekey_XXXXXXX
  const password = 'testpassword_6JpDLl2tGvCShpS1tJWXHV6sVPJpLiCGOUAzvkJtl2HZk'

  // format: api.my.psp.domain.name without https
  const endpoint = 'api.micuentaweb.pe'

  const createPaymentEndpoint = `https://${username}:${password}@${endpoint}/api-payment/V4/Charge/CreatePayment`

  //aqui vemos el objeto que nos llega desde el front con los productos 
  console.log("Datos de cada producto comprado:", paymentConf.customer.shoppingCart.cartItemInfo);


  try {
    const response = await axios.post(createPaymentEndpoint, {
      ...paymentConf, 
      customer: {
        billingDetails: {
          firstName: paymentConf.customer.billingDetails.firstName,
          lastName: paymentConf.customer.billingDetails.lastName,
          identityType: paymentConf.customer.billingDetails.identityType,
          identityCode: paymentConf.customer.billingDetails.identityCode,
          cellPhoneNumber: paymentConf.customer.billingDetails.cellPhoneNumber,
        },
        email: paymentConf.customer.email,
        shippingDetails: {
          address: paymentConf.customer.shippingDetails.address,
          district: paymentConf.customer.shippingDetails.district,
          city: paymentConf.customer.shippingDetails.city,
          phoneNumber: paymentConf.customer.shippingDetails.phoneNumber,
        },
        shoppingCart: {
          cartItemInfo: paymentConf.customer.shoppingCart.cartItemInfo.map(item => ({
            productLabel: item.productLabel,
            productQty: item.productQty,
            productAmount: item.productAmount,
          })),
        }
      },
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response?.data?.answer?.formToken) throw response
    return response.data.answer.formToken
  } catch (error) {
    throw error
  }
}
