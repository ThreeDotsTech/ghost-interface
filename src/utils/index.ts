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
  }