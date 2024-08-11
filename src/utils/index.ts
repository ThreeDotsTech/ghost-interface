import { DERO_ATOMIC_UNIT_FACTOR } from "../constants/misc";

//Gets all the String keys which match the form of an address or SCID
export function getAddressKeys(stringkeys: { [k: string]: string | number; C: string }): string[] {
    const addressRegex = /^[a-zA-Z0-9]{64}$/;
    return Object.keys(stringkeys).filter((key) => addressRegex.test(key));
}

export function getAssetNameHeader(stringkeys: { [k: string]: string | number; C: string }): string | undefined {
  // Check if 'nameHdr' exists and is a string
  let encodedValue: string | undefined;

  if (typeof stringkeys['nameHdr'] === 'string') {
    encodedValue = stringkeys['nameHdr'] as string;
  } else if (typeof stringkeys['name'] === 'string') {
    encodedValue = stringkeys['name'] as string;
  } else {
    return undefined;
  }

  // Decode the content from hexadecimal to a UTF-8 string
  const decodedValue = hexToUtf8(encodedValue);

  return decodedValue;
}

// Validate input to allow no more than 5 decimal places
export const validateAssetUnitsFormat = (assetUnits: string) => {
  const regex = /^\d*\.?\d{0,5}$/;
  return regex.test(assetUnits);
};

export const atomicUnitsToString = (atomicUnits: number) => {
    const numberAsString = (atomicUnits * DERO_ATOMIC_UNIT_FACTOR).toFixed(5);
    return numberAsString;
};

export const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Compares two maps to check if they are equal
export const isEqual = (obj1: any, obj2: any): boolean => {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;
  for (let key in obj1) {
      if (!isEqual(obj1[key], obj2[key])) return false;
  }
  return true;
};

// Helper function to decode a hex string to a UTF-8 string
function hexToUtf8(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

// Helper function to compare two objects shallowly
export const shallowEqual = (obj1: any, obj2: any) => {
  // If either obj1 or obj2 is null or undefined, return false
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
};