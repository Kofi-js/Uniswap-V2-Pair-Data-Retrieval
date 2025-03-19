import React from 'react';
import { useAppContext } from './context/useAppContext';

function App() {
  const { 
    pairAddress, 
    setPairAddress, 
    data, 
    loading, 
    error, 
    fetchPairData 
  } = useAppContext();

  const handleFetchData = () => {
    fetchPairData(pairAddress);
  };

  // Calculate price ratio if data is available
  const calculatePriceRatio = () => {
    if (!data) return null;
    
    const reserve0 = parseFloat(data.reserves.formattedReserve0);
    const reserve1 = parseFloat(data.reserves.formattedReserve1);
    
    if (reserve0 === 0) return "N/A";
    
    return (reserve1 / reserve0).toFixed(6);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Uniswap V2 Pair Explorer</h1>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={pairAddress}
          onChange={(e) => setPairAddress(e.target.value.trim())}
          placeholder="Pair contract address"
          style={{ 
            width: '70%', 
            padding: '8px', 
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginRight: 10 
          }}
        />
        <button 
          onClick={handleFetchData} 
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginTop: 10, padding: 10, backgroundColor: '#ffeeee', borderRadius: '4px' }}>{error}</div>}

      {data && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'gray', padding: '15px', borderRadius: '8px' }}>
              <h2>Token 0: {data.token0.symbol}</h2>
              <div>Name: {data.token0.name}</div>
              <div>Symbol: {data.token0.symbol}</div>
              <div>Decimals: {data.token0.decimals}</div>
              <div>Address: <span style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{data.token0.address}</span></div>
              <div>Reserve: {parseFloat(data.reserves.formattedReserve0).toLocaleString()} {data.token0.symbol}</div>
            </div>
            
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'gray', padding: '15px', borderRadius: '8px' }}>
              <h2>Token 1: {data.token1.symbol}</h2>
              <div>Name: {data.token1.name}</div>
              <div>Symbol: {data.token1.symbol}</div>
              <div>Decimals: {data.token1.decimals}</div>
              <div>Address: <span style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{data.token1.address}</span></div>
              <div>Reserve: {parseFloat(data.reserves.formattedReserve1).toLocaleString()} {data.token1.symbol}</div>
            </div>
          </div>

          <div style={{ marginTop: '20px', backgroundColor: 'gray', padding: '15px', borderRadius: '8px' }}>
            <h2>Pool Info</h2>
            <div>Pair Address: <span style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{data.pairAddress}</span></div>
            <div>Total Supply: {parseFloat(data.totalSupply).toLocaleString()} LP tokens</div>
            <div>Raw Reserves: {data.reserves.reserve0} / {data.reserves.reserve1}</div>
            <div>Price: 1 {data.token0.symbol} = {calculatePriceRatio()} {data.token1.symbol}</div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#666' }}>
            <p>Try some popular Uniswap V2 pairs:</p>
            <ul>
              <li>ETH/USDC: 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc</li>
              <li>ETH/USDT: 0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852</li>
              <li>WBTC/ETH: 0xBb2b8038a1640196FbE3e38816F3e67Cba72D940</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;