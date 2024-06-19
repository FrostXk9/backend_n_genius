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



const getOrder = async (req, res, token, outletRef, orderRef) => {
    const {data} = await axios.get(` https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outletRef}/orders/${orderRef}`,{
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    console.log(data)
}

const createOrder = async (req, res, token) => {
    const { currencyCode, value } = req.body;

    if (!currencyCode || !value) {
        return res.status(400).json({ error: 'Invalid request: currencyCode and value are required' });
    }

    const postData = {
        action: "PURCHASE",
        amount: {
            currencyCode: currencyCode,
            value: value
        }
    };

    
    try {
        const outlet = process.env.OUTLET_REF;
        // console.log("Following token: " + token)
        const response = await axios.post(
            `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outlet}/orders`,
            postData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/vnd.ni-payment.v2+json',
                    Accept: 'application/vnd.ni-payment.v2+json'
                }
            }
        );

        const orderReference = response.data;
        const orderPaypageUrl = response.data;

        console.log('Order Reference:', orderReference);
        console.log('Order Pay Page URL:', orderPaypageUrl);

        res.json({ orderReference, orderPaypageUrl });

    } catch (error) {
        console.error('Error creating order:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create order' });
        console.log(postData);
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
            const token = response.data.access_token;
            console.log(response.data);

            await createOrder(req, res, token);
            // await getOrder(req, res, token, process.env.OUTLET_REF)
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
