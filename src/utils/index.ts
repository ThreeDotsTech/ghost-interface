import { DERO_ATOMIC_UNIT_FACTOR } from "../constants/misc";

//Gets all the String keys which match the form of an address or SCID
export function getAddressKeys(stringkeys: { [k: string]: string | number; C: string }): string[] {
    const addressRegex = /^[a-zA-Z0-9]{64}$/;
    return Object.keys(stringkeys).filter((key) => addressRegex.test(key));
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

// Compares two maps to check if they are equal
export const isEqual = (obj1: any, obj2: any): boolean => {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;
  for (let key in obj1) {
      if (!isEqual(obj1[key], obj2[key])) return false;
  }
  return true;
};
