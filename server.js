import { config } from 'dotenv';
config();
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const PORT = process.env.PORT_NO;
const app = express();

// Cross Origin resource sharing: allows my front-end to access the server and make requests
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

/* passing parameters to make it easier to call the function 
   and use the values in their respective positions */
const getOrder = async (token, outletRef, orderRef) => {
    const data = await axios.get(` https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outletRef}/orders/${orderRef}`,{
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    console.log("Order Data:" + "\n" + data)
}

// Function to grab the access token
const createOrder = async (access_token) => {
    const outlet = process.env.OUTLET_REF;
    
    try {

        const response = await axios.post(
            `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outlet}/orders`,
            {
                action: "AUTH",                                 // AUTH && PURCHASE
                amount:{ currencyCode: "AED", value: 1000 },    // AED & 1000
                emailAddress: "customer@test.com",              // customer@test.com
                payment : {
                    cardholderName: 'VISA',                     // VISA
                    pan: '6250947000000014',                    // 6250947000000014
                    expiry: '12/33',                            // 12/33
                    cvv: '123'                                  // 123
                }
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
        // const orderPaypageUrl = response.data._links.payment.href;

        // console.log(orderReference, +"\n"+ orderPaypageUrl);

        // await getOrder(access_token, outlet, orderReference)

        console.log(response.data)

        // payment: {
        //     href: 'https://paypage.sandbox.ngenius-payments.com/?code=c847c66e285e84c3'
        // },

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

            res.send(response.data);

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});