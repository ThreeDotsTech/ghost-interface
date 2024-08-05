export function getInputPrice(inputAmount: number, inputReserve: number, outputReserve: number) {
    const inputAmountWithFee = inputAmount * 997;
    return inputAmountWithFee * outputReserve / ((inputReserve * 1000) + inputAmountWithFee);
  }
  
export  function getOutputPrice(outputAmount: number, inputReserve: number, outputReserve: number) {
    return (inputReserve * 1000) * outputAmount / ((outputReserve - outputAmount) * 997 + 1);
  }