
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for frontend requests
app.use(express.static('public')); // Serve files from the 'public' folder


// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

// Create a schema for ticker data
const TickerSchema = new mongoose.Schema({
    name: String,
    last: String,
    buy: String,
    sell: String,
    volume: String,
    base_unit: String,
});

const Ticker = mongoose.model('Ticker', TickerSchema);

// Fetch top 10 results from WazirX API and store them in MongoDB
const fetchAndStoreData = async () => {
    try {
        const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
        const tickers = Object.values(response.data).slice(0, 10); // Get top 10 tickers

        await Ticker.deleteMany({}); // Clear old data
        tickers.forEach(async (ticker) => {
            const newTicker = new Ticker({
                name: ticker.name,
                last: ticker.last,
                buy: ticker.buy,
                sell: ticker.sell,
                volume: ticker.volume,
                base_unit: ticker.base_unit,
            });
            await newTicker.save(); // Save each ticker to MongoDB
        });
        console.log('Data fetched and stored in MongoDB');
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// Call fetchAndStoreData immediately, then every 10 minutes
setInterval(fetchAndStoreData, 600000); // Fetch every 10 minutes
fetchAndStoreData();

// API route to get data from MongoDB and send to frontend
app.get('/api/tickers', async (req, res) => {
    try {
        const tickers = await Ticker.find({}); // Get all records from MongoDB
        res.json(tickers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
