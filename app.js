'use strict';
require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
//const path = require('path')
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer')
//const { createCanvas, Image } = require('canvas');
//const Chart = require('chart.js');
//const fs = require('fs');
//const moment = require('moment');
// require('chartjs-adapter-moment');




//JashanSuthagar@05112012
//22SWW3DF4I4QDAWY -  alphavantage api key
//const port = process.env.PORT || 6969;

const server = express()
server.use(bodyParser.json());
server.use(express.urlencoded({ extended: true, parameterLimit: 10000, parseArrays: true }))
const uri = 'mongodb+srv://harishbhalaa:harishninja@cluster0.0ap9ule.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB connection string
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so we add 1
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
async function getStockSymbol(stockName) {
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${stockName}&apikey=22SWW3DF4I4QDAWY`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      console.log('Status:', response.status);
      return "";
    }

    const data = response.data;
    if (data && data.bestMatches && data.bestMatches.length > 0) {
      return data.bestMatches[0]['1. symbol'];
    } else {
      return "";
    }
  } catch (error) {
    console.log('Error:', error.message);
    return "";
  }
}
async function getStockAnalysis(stockSymbol) {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const encodedParams = new URLSearchParams();
  encodedParams.set('symbol', stockSymbol);
  encodedParams.set('end', formatDate(today));
  encodedParams.set('start', formatDate(lastMonth));

  const options = {
    method: 'POST',
    url: 'https://yfinance-stock-market-data.p.rapidapi.com/price-customdate',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'X-RapidAPI-Key': '2179808fd1msh04d9b9f1e7bdb1ep16ca8cjsn758d66e63226',
      'X-RapidAPI-Host': 'yfinance-stock-market-data.p.rapidapi.com'
    },
    data: encodedParams,
  };

  try {
    const response = await axios.request(options);
    const finalData = response.data.data;
    //console.log(response);
    var indexes = [];
    var dates = [];
    var prices = [];
    const chartData = [['Time', 'Price']];
    for (var i = 0; i < finalData.length; i++) {
      indexes.push(i);
      prices.push(finalData[i]['Adj Close']);
      dates.push(new Date(finalData[i]['Date']))
      chartData.push([formatDate(new Date(finalData[i]['Date'])), finalData[i]['Adj Close']]);
      //console.log(indexes[i]+":"+ dates[i] + " : " + finalData[i]['Adj Close']);
    }
    
    //console.log(chartData);
    // // Convert the timestamps to formatted dates
    // const formattedDates = dates.map((timestamp) => moment(timestamp).format('YYYY-MM-DD'));
   
    // Launch a headless browser using puppeteer
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath: process.env.NODE_ENV ==='production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    // await page.setDefaultNavigationTimeout(60000);
    // Generate the HTML content for the Google Chart
    const chartHtml = `
      <html>
        <head>
          <!-- Load the Google Charts library -->
          <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
          <script type="text/javascript">
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawChart);

            function drawChart() {
              var data = google.visualization.arrayToDataTable(${JSON.stringify(chartData)});

              var options = {
                title: 'STOCK ANALYSIS',
                width: 800,
                height: 600,
                curveType: 'none', // Set to 'none' to disable curves
              };

              var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
              chart.draw(data, options);
            }
          </script>
        </head>
        <body>
          <!-- Placeholder for the Google Chart -->
          <div id="chart_div"></div>
        </body>
      </html>
    `;
     console.log(chartData);
    // Set the content and generate a screenshot
    await page.setContent(chartHtml);
    
    // await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    // await page.setDefaultTimeout(2000);
    // await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
 // Wait for the chart to render (you can adjust the wait time if needed)
    const screenshot = await page.screenshot({ encoding: 'binary' });
            
    // Close the browser
    await browser.close();

    return screenshot;
  } catch (error) {
    console.error('Error while creating the Google Line chart:', error);
    return null;
  }
}
async function getStockData(stockSymbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol}&apikey=22SWW3DF4I4QDAWY`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      console.log('Status:', response.status);
      return "";
    }

    const data = response.data['Global Quote'];
    const formattedData = {};

    // Extract the relevant data and remove the numeric prefixes and initial spaces
    for (const key in data) {
      const formattedKey = key.replace(/^\d+\.\s*/, '').trim();
      formattedData[formattedKey] = data[key];
    }
    return formattedData;
  } catch (error) {
    console.log('Error:', error.message);
    return "";
  }
}

server.get('/',(req,res)=>{
  res.send("node js file running");
})
/**
 * To check for working....
 * http://localhost:6969/bankPayment?bankName=bank_z&&payerAcNum=7898765434567845&&recipientAcNum=7834009890767845&&pin=1106&&Amount=200
 */
server.get("/bankPayment", async (req, res) => {
  try {``
    const bank = req.query.bankName;
    var payer, recipient, query, R_database, R_collection;
    const P_database = client.db(bank); // Replace with your database name
    const P_collection = P_database.collection('customer'); // Replace with your collection name
    // console.log(req.query.AcNum)
    query = { 'Account Number': { $eq: parseInt(req.query.payerAcNum,10) } }; // Specify your query if needed
    payer = await P_collection.find(query).toArray();

    if (payer.length === 0) {
      res.status(500).send({ result: "enter valid account details" });
      return;
    }
    const banks = ["bank_x", "bank_y", "bank_z"];
    for (var i = 0; i < 3; i++) {
      R_database = client.db(banks[i]); // Replace with your database name
      R_collection = R_database.collection('customer'); // Replace with your collection name
      // console.log(req.query.AcNum)
      query = { 'Account Number': { $eq: parseInt(req.query.recipientAcNum,10) } }; // Specify your query if needed
      recipient = await R_collection.find(query).toArray();
      if (recipient.length != 0) {
        break;
      }
    }
    if (recipient.length === 0) {
      res.status(500).send({ result: "enter valid recipient credentials" })
      return;
    }
    else if (payer[0].pin != parseInt(req.query.pin,10)) {
      res.status(500).send({ result: "Enter valid pin" });
      return;
    }
    else if (parseFloat(payer[0].Balance) < parseFloat(req.query.Amount)) {
      res.status(500).send({ result: "Insufficient Funds in your account" });
      return;
    }
    else {
      const debit = await P_collection.updateOne({ _id: payer[0]._id }, { $set: { Balance: (parseFloat(payer[0].Balance) - parseFloat(req.query.Amount)) } });
      const credit = await R_collection.updateOne({ _id: recipient[0]._id }, { $set: { Balance: (parseFloat(recipient[0].Balance) + parseFloat(req.query.Amount)) } });
      if (debit.modifiedCount == 1 && credit.modifiedCount == 1) {
        res.status(200).send({ result: "Transaction Successful" });
      }
      else {
        res.status(500).send({ result: "Transaction Failed" });
      }
    }
  }
  catch (err) {
    console.log(err)
  }
})
/**
 *  To check for working.... 
 *  http://localhost:6969/checkBalance?AcNum=7898765434567845&&pin=1106
 */
server.get("/checkBalance", async (req, res) => {
  try {
    const banks = ["bank_x", "bank_y", "bank_z"];
    var result;
    for (var i = 0; i < 3; i++) {
      const database = client.db(banks[i]); // Replace with your database name
      const collection = database.collection('customer'); // Replace with your collection name
      // console.log(parseInt(req.query.AcNum,10));
      const query = { 'Account Number': { $eq: parseInt(req.query.AcNum,10) } }; // Specify your query if needed
      result = await collection.find(query).toArray();
      if (result.length != 0) {
        break;
      }
    }
    if (result.length == 0) {
      res.status(500).send({ result: "enter valid credentials" })
      return;
    }
    const resultJson = result[0];
    // console.log('Retrieved data:', resultJson);
    if (resultJson.pin === parseInt(req.query.pin,10)) {
      res.status(200).send({ result: resultJson.Balance })
    }
    else {
      res.status(500).send({ result: "enter valid pin" }) 
    }
  } catch (err) {
    console.error('Error retrieving data:', err);
  }
})
/**
 * To check for working...
 * http://localhost:6969/getStockGraph?stockName=apple 
 */
server.get('/getStockGraph', async (req, res) => {
  var symbol = await getStockSymbol(req.query.stockName);
  if (symbol.length != 0) {
    res.setHeader('Content-Type', 'image/png');
    res.send(await getStockAnalysis(symbol));
  }
  else {
    res.status(500).json({ 'symbol': 'No stock found' });
  }
})
/**
 * To check for working...
 * http://localhost:6969/getStockInfo?stockName=apple 
 */
server.get("/getStockInfo", async (req, res) => {
  var symbol = await getStockSymbol(req.query.stockName);
  if (symbol.length != 0) {
    res.status(200).json(await getStockData(symbol));
  }
  else {
    res.status(500).json({ 'symbol': 'No stock found' });
  }
})
server.listen(process.env.PORT || 3000, () => {
  console.log(`server running `);
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  catch (err) {
    console.error(err);
  }
})






