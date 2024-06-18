import express from 'express';
import axios from 'axios';

const PORT = 7000;
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("<h1>Hello world</h1>");
});

app.post('/api/access-token', async (req, res) => {
    try {
        const reference = 'ae2059b8-8054-44e3-9a6a-0f5356c9f408';
        const apiKey = 'ZTg4ODU0ZjQtNTgxNi00NDMzLTkxMzQtMTY5NzFhZGZhZjRkOjg5ZjgyMThlLTM1NjItNDM2NS1hODllLTNkNWI1MWVmMWEyNw==';

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

        res.json(response.data);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch access token' });
    }
});

app.get('/api/order-status/:orderReference', async (req, res) => {
    try {
        const accessToken = req.query.accessToken; // Access token obtained from frontend
        const outletReference = 'MY_OUTLET_REFERENCE';
        const orderReference = req.params.orderReference;

        const response = await axios.get(
            `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${outletReference}/orders/${orderReference}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching order status:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch order status' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
