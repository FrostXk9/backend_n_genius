import { config } from 'dotenv';
config();
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import querystring from 'querystring';


const PORT = process.env.PORT_NO;
const app = express();

// Cross Origin resource sharing: allows my front-end to access the server and make requests
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());


// Function to grab the access token
const createOrder = async (access_token) => {
    const outlet = process.env.OUTLET_REF;
    
    try {

        const response = await axios.post(
            `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outlet}/orders`,
            {
                action: "PURCHASE",                             // AUTH && PURCHASE
                amount:{ currencyCode: "AED", value: 1000 },    // AED & 1000
                emailAddress: "customer@test.com"               // customer@test.com
                // payment : {
                //     cardholderName: 'VISA',                  // VISA
                //     pan: '6250947000000014',                 // 6250947000000014
                //     expiry: '12/33',                         // 12/33
                //     cvv: '123'                               // 123
                // }
            },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/vnd.ni-payment.v2+json",
                    Accept: "application/vnd.ni-payment.v2+json"
                }
            }
        );
        
        // Extract and log useful information from the response

        // const orderReference = response.data.reference;
        // const outletID = response.data.outletId;
        const orderPaypageUrl = response.data._links.payment.href;

        // console.log(orderReference);
        console.log(orderPaypageUrl);
        return response.data

    } catch (error) {

        // Log any errors encountered during the request
        if (error.response) {

            console.log('Error creating order:', error.response.data);

        } else {

            console.log('Error creating order:', error.message);

        }

    }
};
  
// Creating an api endpoint so I can access it from my front-end
app.post('/api/access-token', async (req, res) => {

    try {
        // Storing API_KEY in a protected enviroment
        const apiKey = process.env.API_KEY;

        const response = await axios.post(
            'https://api-gateway.sandbox.ngenius-payments.com/identity/auth/access-token',
            { realmName: req.body.realmName },
            {
              headers: {
                'Content-Type': 'application/vnd.ni-identity.v1+json',
                'Authorization': `Basic ${apiKey}`
              }
            }
        );

        if (response.status === 200) {
          // Destructuring the access token out of the response
          const {access_token} = response.data;
          const info = await createOrder(access_token);
          res.send({data: info});

          // Pass the token into the create order function
          await createOrder(access_token);

        } else {

          res.status(response.status).json({ error: 'Failed to fetch access token' });
            
        }

    } catch (error) {

      console.error('Error fetching access token:', error.response ? error.response.data : error.message);

      res.status(500).json({ error: 'Failed to fetch access token' });

    }

});


async function getAuthToken() {
  try {
      const API_KEY = 'MzJmZDRhMzItNjJkZC00ZTcyLTkwOTItZDc2MDlkZjRiZWFjOjY5MDA5M2U3LTMxMjUtNDBiNS1iMzRkLTk3ZjVjZTI1YTQxZQ==';
      const {
        data: { access_token: accessToken } 
      } = await axios.post(
        'https://api-gateway.sandbox.ngenius-payments.com/identity/auth/access-token',
        { grant_type: 'client_credentials' },
        {
          headers: {
            "Content-Type": "x-www-form-urlencoded",
            Authorization: `Basic ${API_KEY}`
          }
        }
      );
      // console.log(accessToken);
      return accessToken;
    } catch (error) {
      console.error('Error fetching auth token:', error);
      throw new Error('Failed to retrieve access token');
  }
  }
  
  app.post('/api/hosted-sessions/payment', async (req, res) => {
    // const { sessionId, order } = req.body;
    const { sessionId, order } = req.body;
    try {
      const accessToken = await getAuthToken();
      console.log("Token!::::" + accessToken)
    //   console.log(order)
      const paymentResponse = await axios.post(
        `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${process.env.OUTLET_REF}/payment/hosted-session/${sessionId}`,
        {
            
            
            ...order
            // action: "SALE",
            // amount: {currencyCode: req.body.currencyCode, value: req.body.value},
            // payment: { currency: req.body.currency }
            
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.ni-payment.v2+json',
            Accept: 'application/vnd.ni-payment.v2+json'
          }
        }
      );
      res.status(200).send(paymentResponse.data);
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).send({ message: 'Payment processing failed', error: error.message });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});