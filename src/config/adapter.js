import { ethers } from 'ethers';

// Standard provider setup
export function getProvider() {
  try {
    const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_ALCHEMY_RPC_URL);
    console.log('Provider initialized successfully');
    return provider;
  } catch (error) {
    console.error('Failed to initialize provider:', error);
    throw new Error('Failed to initialize provider');
  }
}

// Helper to decode data with error handling
export function decodeResult(iface, method, data) {
  try { 
    return iface.decodeFunctionResult(method, data)[0]; 
  } catch (error) {
    console.error(`Failed to decode ${method}:`, error);
    return method === 'decimals' ? 18 : 'N/A';
  }
}