import { config } from 'dotenv';
config();
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const PORT = process.env.PORT_NO;
const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());



const getOrder = async (token, outletRef, orderRef) => {
    const {data} = await axios.get(` https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outletRef}/orders/${orderRef}`,{
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    console.log(data)
}

const createOrder = async (access_token) => {
    const outlet = process.env.OUTLET_REF;
    
    try {

        // if (access_token) {
            const response = await axios.post(
                `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outlet}/orders`,
                {action: "PURCHASE", amount:{ currencyCode: "AED", value: 1000 }, emailAddress: "customer@test.com"},
                {
                    headers: {
                        "Authorization": `Bearer ${access_token}`,
                        "Content-Type": "application/vnd.ni-payment.v2+json",
                        "Accept": "application/vnd.ni-payment.v2+json"
                    }
                }
            );

            // Extract and log useful information from the response
            console.log('Response Data:', response.data);
            console.log(response.headers)
        // }

    } catch (error) {
        // Log any errors encountered during the request
        if (error.response) {
            console.log('Error creating order:', error.response.data);
        } else {
            console.log('Error creating order:', error.message);
        }
    }
};
  

app.post('/api/access-token', async (req, res) => {
    try {
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
            const {access_token} = response.data;
            res.send(response.data);
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
