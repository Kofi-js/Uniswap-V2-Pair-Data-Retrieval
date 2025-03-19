import { createContext, useContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getProvider, decodeResult } from '../config/Adapter';
import  multicallAbi from '../ABI/multicallAbi.json'
import  pairAbi  from '../ABI/pairAbi.json'
import tokenAbi  from '../ABI/tokenAbi.json'

const MULTICALL_ADDRESS = import.meta.env.VITE_MULTICALL_ADDRESS
console.log('MULTICALL_ADDRESS from env:', MULTICALL_ADDRESS);

const AppContext = createContext();

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
      throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
  }

// Provider component
export function AppProvider({ children }) {
  const [pairAddress, setPairAddress] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch pair data using multicall
  const fetchPairData = useCallback(async (address) => {
    if (!address) {
      setError('Please enter a pair address');
      return;
    }

    if (!ethers.isAddress(address)) {
      setError('Invalid Ethereum address format');
      return;
    }

    if (!MULTICALL_ADDRESS) {
      setError('Multicall address not configured');
      return;
    }

    if (!ethers.isAddress(MULTICALL_ADDRESS)) {
      setError('Invalid multicall address configuration');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Failed to initialize provider');
      }

      console.log('Initializing multicall contract with address:', MULTICALL_ADDRESS);
      const multicall = new ethers.Contract(MULTICALL_ADDRESS, multicallAbi, provider);
      if (!multicall) {
        throw new Error('Failed to initialize multicall contract');
      }
      
      const pairInterface = new ethers.Interface(pairAbi);
      const tokenInterface = new ethers.Interface(tokenAbi);

      // First multicall for pair data
      const pairCalls = [
        { target: address, callData: pairInterface.encodeFunctionData('token0') },
        { target: address, callData: pairInterface.encodeFunctionData('token1') },
        { target: address, callData: pairInterface.encodeFunctionData('getReserves') },
        { target: address, callData: pairInterface.encodeFunctionData('totalSupply') },
      ];

      console.log('Making multicall with address:', address);
      console.log('Multicall address:', MULTICALL_ADDRESS);
      console.log('Pair calls:', pairCalls);
      
      const [, pairResults] = await multicall.aggregate.staticCall(pairCalls);
      
      if (!pairResults || pairResults.length < 4) {
        throw new Error('Failed to fetch pair data - invalid response');
      }

      const token0 = pairInterface.decodeFunctionResult('token0', pairResults[0])[0];
      const token1 = pairInterface.decodeFunctionResult('token1', pairResults[1])[0];
      const [reserve0, reserve1] = pairInterface.decodeFunctionResult('getReserves', pairResults[2]);
      const totalSupply = pairInterface.decodeFunctionResult('totalSupply', pairResults[3])[0];

      // Second multicall for token data
      const tokenCalls = [
        { target: token0, callData: tokenInterface.encodeFunctionData('name') },
        { target: token0, callData: tokenInterface.encodeFunctionData('symbol') },
        { target: token0, callData: tokenInterface.encodeFunctionData('decimals') },
        { target: token1, callData: tokenInterface.encodeFunctionData('name') },
        { target: token1, callData: tokenInterface.encodeFunctionData('symbol') },
        { target: token1, callData: tokenInterface.encodeFunctionData('decimals') },
      ];

      let tokenResults;
      try {
        [, tokenResults] = await multicall.aggregate.staticCall(tokenCalls);
      } catch (err) {
        console.error("Token data fetch failed:", err);
        tokenResults = Array(6).fill("0x");
      }

      // Extract token data
      const token0Data = {
        address: token0,
        name: decodeResult(tokenInterface, 'name', tokenResults[0]),
        symbol: decodeResult(tokenInterface, 'symbol', tokenResults[1]),
        decimals: decodeResult(tokenInterface, 'decimals', tokenResults[2]),
      };

      const token1Data = {
        address: token1,
        name: decodeResult(tokenInterface, 'name', tokenResults[3]),
        symbol: decodeResult(tokenInterface, 'symbol', tokenResults[4]),
        decimals: decodeResult(tokenInterface, 'decimals', tokenResults[5]),
      };

      // Format reserves according to decimals
      const formattedReserve0 = ethers.formatUnits(reserve0, token0Data.decimals);
      const formattedReserve1 = ethers.formatUnits(reserve1, token1Data.decimals);

      setData({
        token0: token0Data,
        token1: token1Data,
        reserves: {
          reserve0: reserve0.toString(),
          reserve1: reserve1.toString(),
          formattedReserve0,
          formattedReserve1
        },
        totalSupply: ethers.formatUnits(totalSupply, 18),
        pairAddress: address
      });

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    pairAddress,
    setPairAddress,
    data,
    loading,
    error,
    fetchPairData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

