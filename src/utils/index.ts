//Gets all the String keys which match the form of an address or SCID
export function getAddressKeys(stringkeys: { [k: string]: string | number; C: string }): string[] {
    const addressRegex = /^[a-zA-Z0-9]{64}$/;
    return Object.keys(stringkeys).filter((key) => addressRegex.test(key));
}