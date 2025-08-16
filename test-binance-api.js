const axios = require('axios');

const BASE_URL = 'http://129.212.143.6:3000';

async function testBinanceEndpoints() {
  console.log('🚀 Testing Binance API Endpoints...\n');

  try {
    // Test USD-M Account
    console.log('🔍 Testing USD-M Account...');
    const usdmAccount = await axios.get(`${BASE_URL}/api/binance/futures/account`);
    console.log('📊 USD-M Account Response:');
    console.log(JSON.stringify(usdmAccount.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // Test USD-M Positions
    console.log('🔍 Testing USD-M Positions...');
    const usdmPositions = await axios.get(`${BASE_URL}/api/binance/futures/positions`);
    console.log('📊 USD-M Positions Response:');
    console.log(JSON.stringify(usdmPositions.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // Test COIN-M Account
    console.log('🔍 Testing COIN-M Account...');
    const coinmAccount = await axios.get(`${BASE_URL}/api/binance/coinm/account`);
    console.log('📊 COIN-M Account Response:');
    console.log(JSON.stringify(coinmAccount.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // Test COIN-M Positions
    console.log('🔍 Testing COIN-M Positions...');
    const coinmPositions = await axios.get(`${BASE_URL}/api/binance/coinm/positions`);
    console.log('📊 COIN-M Positions Response:');
    console.log(JSON.stringify(coinmPositions.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // Test Health Status
    console.log('🔍 Testing Health Status...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('📊 Health Response:');
    console.log(JSON.stringify(health.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing endpoints:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testBinanceEndpoints();
