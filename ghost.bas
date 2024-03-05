
//          .-.
//         (o o) 
//         | O \  boo!
//         |    \
//         '~~~~'
//    ?
//   /\                     ___
//  (oo)                   |RIP|
//  /||\                   |___|
//////////////////////////////////////
// Ghost Exchange
// Use at your own risk
// For more info visit: ghost.trading
//////////////////////////////////////

Function Initialize() Uint64
    10 STORE("owner", SIGNER())
    20 STORE("feeTo", SIGNER())
    30 STORE("nameHdr", "Ghost Exchange")
    40 STORE("descrHdr", "Spooktacular trades await!") 
    50  RETURN 0
End Function 

// Provided liquidity will be tracked using BOO tokens. 
// BOO TOKENS ARE NOT ASSETS. Each account's BOO balance per token pair is stored 
// inside the Smart Contract as a variable with the following schema:
// <provider_address>:BOO:<asset_address>
// The total liquidity provided by all LPs of a pair at a given moment is denominated supply.
// supply is tracked inside the Smart Contract as a variable with the following schema:
// <asset_address>:BOO
// Deposit assets and DERO at current ratio to get BOO tokens. 
// {asset_address} The deposited asset's SCID
// {min_liquidity} Minimum number of BOO sender will get if total BOO supply is greater than 0.
// {min_liquidity} does nothing when total BOO supply is 0.
Function AddLiquidity(asset_address String, min_liquidity Uint64) Uint64
    01 DIM total_liquidity, dero_reserve, asset_reserve, asset_amount, liquidity_minted, dero_deposited, asset_deposited as Uint64
    02 LET dero_deposited = DEROVALUE()
    03 LET asset_deposited = ASSETVALUE(HEXDECODE(asset_address))
    10 IF (asset_deposited > 0 & dero_deposited > 0 ) THEN GOTO 30
    20 GOTO 666
    30 LET total_liquidity =  get_supply_per_asset(asset_address) 
    // Pair already exists
    40 IF total_liquidity > 0 THEN GOTO 41 ELSE GOTO 60
        41 IF min_liquidity > 0 THEN GOTO 43
        42 GOTO 666  
        43 LET dero_reserve = get_dero_reserve_per_asset(asset_address) 
        44 LET asset_reserve = get_asset_reserve(asset_address)     
        45 mintFee(dero_reserve, asset_reserve, asset_address)
        46 LET total_liquidity = get_supply_per_asset(asset_address) // Must be defined again since totalSupply can update in mintFee
        47 LET asset_amount =   dero_deposited * asset_reserve / dero_reserve + 1
        48 LET liquidity_minted = dero_deposited * total_liquidity / dero_reserve
        49 IF asset_deposited >= asset_amount & liquidity_minted >= min_liquidity THEN GOTO 51
        50 GOTO 666
        51 increase_provider_liquidity_by(SIGNER(), liquidity_minted, asset_address) 
        52 set_supply_per_asset(total_liquidity + liquidity_minted, asset_address)
        53 IF asset_deposited == asset_amount THEN GOTO 55
        // Return any reminding assets
        54 SEND_ASSET_TO_ADDRESS(SIGNER(), asset_deposited - asset_amount, HEXDECODE(asset_address))
        // Increase the dero reserve record for this asset
        55 set_dero_reserve_per_asset(dero_reserve + dero_deposited, asset_address)
        // Increase the asset reserve record
        56 set_asset_reserve(asset_reserve + asset_amount, asset_address)
        57 STORE(asset_address+":kLast",  (dero_reserve + dero_deposited) * (asset_reserve + asset_amount))
        // Return gracefully
        58 GOTO 70
    // else
    // Creating pair  
    60 IF dero_deposited >= 1000 THEN GOTO 62
        61 GOTO 666
        // Initialize the asset reserve record for this asset
        62 set_asset_reserve(asset_deposited, asset_address)
        63 DIM initial_liquidity as Uint64
        64 LET initial_liquidity = dero_deposited
        65 set_supply_per_asset(initial_liquidity, asset_address)
        // Initialize the dero reserve record for this asset
        66 set_dero_reserve_per_asset(dero_deposited, asset_address)
        67 STORE(asset_address+":kLast", (asset_deposited) * (dero_deposited))
        68 increase_provider_liquidity_by(SIGNER(), initial_liquidity, asset_address)
    70 RETURN 0

    666 RETURN 1
End Function

// Burn BOO tokens to withdraw Dero & assets at current ratio.
// {amount} Amount of BOO burned.
// {min_dero} Minimum DERO withdrawn.
// {min_assets} Minimum assets withdrawn.
// {asset_address} The deposited asset's SCID
Function RemoveLiquidity(amount Uint64, min_dero Uint64, min_assets Uint64, asset_address String) Uint64
    01  DIM total_liquidity, dero_reserve, asset_reserve, dero_amount, asset_amount as Uint64
    10  IF amount > 0  & (min_dero > 0 & min_assets > 0) & ( get_provider_liquidity(SIGNER(), asset_address) >= amount ) THEN GOTO 30
    20  GOTO 666
    30  LET total_liquidity = get_supply_per_asset(asset_address)
    40  IF total_liquidity > 0 THEN GOTO 60
    50  GOTO 666
    60  LET asset_reserve = get_asset_reserve(asset_address)
    70  LET dero_reserve = get_dero_reserve_per_asset(asset_address)
    80  mintFee(dero_reserve, asset_reserve, asset_address)
    90  LET total_liquidity = get_supply_per_asset(asset_address) // Must be defined again since totalSupply can update in mintFee
   100  LET dero_amount  = amount * dero_reserve  / total_liquidity
   110  LET asset_amount = amount * asset_reserve / total_liquidity
   120  IF dero_amount >= min_dero & asset_amount >= min_assets THEN GOTO 140
   130  GOTO 666
   140  decrease_provider_liquidity_by(SIGNER(), amount, asset_address)
   150  set_supply_per_asset(total_liquidity - amount, asset_address)
   160  set_dero_reserve_per_asset(dero_reserve - dero_amount, asset_address)
   170  set_asset_reserve(asset_reserve - asset_amount, asset_address)
   180  STORE(asset_address+":kLast", (dero_reserve - dero_amount) * (asset_reserve - asset_amount) )
   190  SEND_DERO_TO_ADDRESS(SIGNER(), dero_amount)
   200  SEND_ASSET_TO_ADDRESS(SIGNER(),asset_amount, HEXDECODE(asset_address))
   210  RETURN 0

   666  RETURN 1
End Function

// Pricing function for converting between DERO & Assets.
// {input_amount} Amount of DERO or Assets being sold.
// {input_reserve} Amount of DERO or Assets (input type) in exchange reserves.
// {output_reserve} Amount of DERO or Assets (output type) in exchange reserves.
Function getInputPrice(input_amount Uint64, input_reserve Uint64, output_reserve Uint64) Uint64
    10 IF input_reserve > 0 & output_reserve > 0 THEN GOTO 30
    20 PANIC
    30 DIM input_amount_with_fee, numerator, denominator as Uint64
    40 LET input_amount_with_fee = input_amount * 997
    50 LET numerator = input_amount_with_fee * output_reserve
    60 LET denominator = (input_reserve * 1000) + input_amount_with_fee
    70 RETURN numerator / denominator
End Function

// Pricing function for converting between DERO & Assets.
// {output_amount} Amount of DERO or Assets being bought.
// {input_reserve} Amount of DERO or Assets (input type) in exchange reserves.
// {output_reserve} Amount of DERO or Assets (output type) in exchange reserves.
Function getOutputPrice(output_amount Uint64, input_reserve Uint64, output_reserve Uint64) Uint64
    10 IF input_reserve > 0 & output_reserve > 0 THEN GOTO 30
    20 PANIC
    30 DIM numerator, denominator as Uint64
    40 LET numerator = input_reserve * output_amount * 1000
    50 LET denominator = (output_reserve - output_amount) * 997
    60 RETURN numerator / denominator + 1
End Function

Function deroToAssetInput(dero_sold Uint64, min_assets Uint64, asset_address String) Uint64
    10 IF  (dero_sold > 0 & min_assets > 0) THEN GOTO 30
    20 PANIC
    30 DIM assets_bought, asset_reserve, dero_reserve as Uint64
    40 LET asset_reserve = get_asset_reserve(asset_address)
    50 LET dero_reserve = get_dero_reserve_per_asset(asset_address)
    60 LET assets_bought = getInputPrice(dero_sold, dero_reserve, asset_reserve)
    70 IF assets_bought >= min_assets THEN GOTO 90
    80 PANIC
    90 SEND_ASSET_TO_ADDRESS(SIGNER(), assets_bought, HEXDECODE(asset_address))
   100 set_asset_reserve(asset_reserve - assets_bought, asset_address)
   110 set_dero_reserve_per_asset(dero_reserve + dero_sold, asset_address)
   120 RETURN 0
End Function

// Convert DERO to Assets.
// User specifies exact input (DEROVALUE()).
// User cannot specify minimum output.
Function DeroToAssetSwapInput(asset_address String) Uint64
    10 RETURN deroToAssetInput(DEROVALUE(), 1, asset_address)
End Function

// Convert DERO to Assets.
// User specifies exact input (DEROVALUE()) & minimum output.
// {min_assets} Minimum Assets bought.
Function DeroToAssetSwapInputMin(min_assets Uint64, asset_address String) Uint64
    10 RETURN deroToAssetInput(DEROVALUE(), min_assets, asset_address)
End Function

Function deroToAssetOutput(assets_bought Uint64, max_dero Uint64, asset_address String) Uint64
    10 IF (assets_bought > 0 & max_dero > 0) THEN GOTO 30
    20 PANIC
    30 DIM asset_reserve, dero_reserve, dero_sold, dero_refund as Uint64
    40 LET asset_reserve = get_asset_reserve(asset_address)
    41 LET dero_reserve = get_dero_reserve_per_asset(asset_address)
    50 LET dero_sold = getOutputPrice(assets_bought, dero_reserve, asset_reserve)
    60 IF dero_sold > max_dero THEN GOTO 61 ELSE GOTO 70
    61 PANIC
    70 LET dero_refund = max_dero - dero_sold
    80 IF dero_refund == 0 THEN GOTO 100
    90 SEND_DERO_TO_ADDRESS(SIGNER(), dero_refund)
   100 SEND_ASSET_TO_ADDRESS(SIGNER(), assets_bought, HEXDECODE(asset_address))
   110 set_asset_reserve(asset_reserve - assets_bought, asset_address)
   120 set_dero_reserve_per_asset(dero_reserve + dero_sold, asset_address)
   130 RETURN 0
End Function

// Convert DERO to Assets.
// User specifies maximum input (DEROVALUE()) & exact output.
// {assets_bought} Amount of Assets bought.
Function DeroToAssetSwapOutput(assets_bought Uint64, asset_address String) Uint64
    10 RETURN deroToAssetOutput(assets_bought, DEROVALUE(), asset_address)
End Function

Function assetToDeroInput(assets_sold Uint64, min_dero Uint64, asset_address String) Uint64
    10 IF (assets_sold > 0 & min_dero > 0) THEN GOTO 30
    20 PANIC
    30 DIM asset_reserve, dero_bought as Uint64
    40 LET asset_reserve = get_asset_reserve(asset_address)
    50 LET dero_bought = getInputPrice(assets_sold, asset_reserve, get_dero_reserve_per_asset(asset_address))
    60 IF dero_bought >= min_dero THEN GOTO 80
    70 PANIC
    80 SEND_DERO_TO_ADDRESS(SIGNER(),dero_bought)
    90 set_dero_reserve_per_asset(get_dero_reserve_per_asset(asset_address) - dero_bought, asset_address)
   100 set_asset_reserve(asset_reserve + assets_sold, asset_address)
   110 RETURN 0
End Function

// Convert Assets to DERO.
// User specifies exact input (ASSETVALUE(asset_address)) & minimum output.
// {min_dero} Minimum DERO purchased.
Function AssetToDeroSwapInput(min_dero Uint64, asset_address String) Uint64
    10 RETURN assetToDeroInput(ASSETVALUE(HEXDECODE(asset_address)), min_dero, asset_address)
End Function


Function assetToDeroOutput(dero_bought Uint64, max_assets Uint64 , asset_address String) Uint64
    10 IF  dero_bought > 0 THEN GOTO 30
    20 PANIC
    30 DIM asset_reserve, assets_sold, asset_refund as Uint64
    40 LET asset_reserve = get_asset_reserve(asset_address)
    50 LET assets_sold = getOutputPrice(dero_bought, asset_reserve, get_dero_reserve_per_asset(asset_address))
    // assets_sold is always > zero
    60 IF max_assets >= assets_sold THEN GOTO 80
    70 PANIC
    80 SEND_DERO_TO_ADDRESS(SIGNER(), dero_bought)
    90 LET asset_refund = max_assets - assets_sold
   100 IF asset_refund == 0 THEN GOTO 120
   110 SEND_ASSET_TO_ADDRESS(SIGNER(), asset_refund, HEXDECODE(asset_address))
   120 set_dero_reserve_per_asset(get_dero_reserve_per_asset(asset_address) - dero_bought, asset_address)
   130 set_asset_reserve(asset_reserve + assets_sold, asset_address)
   140 RETURN 0
End Function

// Convert Assets to DERO.
// User specifies maximum input (ASSETVALUE(asset_address)) & exact output.
// {dero_bought} Amount of DERO purchased.
Function AssetToDeroSwapOutput(dero_bought Uint64, asset_address String) Uint64
    10 RETURN assetToDeroOutput(dero_bought, ASSETVALUE(HEXDECODE(asset_address)), asset_address)
End Function

// Public price function for DERO to Asset trades with an exact input.
// {dero_sold} Amount of DERO sold.
// @returns Amount of Assets that can be bought with input DERO.
Function GetDeroToAssetInputPrice(dero_sold Uint64, asset_address String) Uint64
    10 IF dero_sold > 0 THEN GOTO 30
    20 RETURN 0
    30 RETURN getInputPrice(dero_sold, get_dero_reserve_per_asset(asset_address), get_asset_reserve(asset_address))
End Function

// Public price function for DERO to Asset trades with an exact output.
// {assets_bought} Amount of Assets bought.
// @returns Amount of DERO needed to buy output Assets.
Function GetDeroToAssetOutputPrice(assets_bought Uint64, asset_address String) Uint64
    10 IF assets_bought > 0 THEN GOTO 30
    20 RETURN 0
    30 RETURN getOutputPrice(assets_bought, get_dero_reserve_per_asset(asset_address), get_asset_reserve(asset_address))
End Function

// Public price function for Asset to DERO trades with an exact input.
// assets_sold Amount of Assets sold.
// @returns Amount of DERO that can be bought with input Assets.
Function GetAssetToDeroInputPrice(assets_sold Uint64, asset_address String) Uint64
    10 IF assets_sold > 0 THEN GOTO 30
    20 RETURN 0
    30 RETURN getInputPrice(assets_sold, get_asset_reserve(asset_address), get_dero_reserve_per_asset(asset_address))
End Function

// Public price function for Asset to DERO trades with an exact output.
// {dero_bought} Amount of output DERO.
// @returns Amount of Assets needed to buy output DERO.
Function GetAssetToDeroOutputPrice(dero_bought Uint64, asset_address String) Uint64
    10 IF dero_bought > 0 THEN GOTO 30
    20 RETURN 0
    30 RETURN getOutputPrice(dero_bought, get_asset_reserve(asset_address), get_dero_reserve_per_asset(asset_address))
End Function

// Helper functions 
// Encapsulated to better understand what's happening and absctract BOO storage schema
// from main code.

Function set_supply_per_asset(amount Uint64, asset_address String) 
    10 STORE(asset_address+":BOO", amount)
    20 RETURN
End Function

Function get_supply_per_asset(asset_address String) Uint64
    10 IF EXISTS(asset_address+":BOO") THEN GOTO 30
    20 RETURN 0
    30 RETURN LOAD(asset_address+":BOO")
End Function

Function set_dero_reserve_per_asset(amount Uint64, asset_address String)
    10 STORE(asset_address+":DERO", amount)
    20 RETURN 
End Function

Function get_dero_reserve_per_asset(asset_address String) Uint64
    10 RETURN LOAD(asset_address+":DERO")
End Function

Function set_asset_reserve(amount Uint64, asset_address String) 
    10 STORE(asset_address, amount)
    20 RETURN 
End Function

Function get_asset_reserve(asset_address String) Uint64
    20 RETURN LOAD(asset_address)
End Function

Function increase_provider_liquidity_by(provider_address String, amount Uint64, asset_address String)
    10 IF EXISTS(ADDRESS_STRING(provider_address)+":BOO:"+asset_address) THEN GOTO 40
    20 STORE(ADDRESS_STRING(provider_address)+":BOO:"+asset_address, amount)
    30 RETURN
    40 STORE(ADDRESS_STRING(provider_address)+":BOO:"+asset_address, get_provider_liquidity(provider_address, asset_address) + amount)
    50 RETURN
End Function

Function decrease_provider_liquidity_by(provider_address String, amount Uint64, asset_address String)
    10 STORE(ADDRESS_STRING(provider_address)+":BOO:"+asset_address, get_provider_liquidity(provider_address, asset_address) - amount)
    20 RETURN
End Function

Function get_provider_liquidity(provider_address String, asset_address String) Uint64
    10 RETURN LOAD(ADDRESS_STRING(provider_address)+":BOO:"+asset_address)
End Function

Function mintFee(reserve0 Uint64, reserve1 Uint64, asset_address String) Uint64
    10 DIM feeTo as String
    11 DIM kLast as Uint64
    20 LET feeTo = LOAD("feeTo") 
    // Get the last k for the asset
    30 LET kLast = LOAD(asset_address+":kLast")
    40 IF kLast != 0 THEN GOTO 50
        41 RETURN 0
    50 DIM rootK, rootKLast as Uint64
    60 LET rootK = sqrt(reserve0 * reserve1)
    70 LET rootKLast = sqrt(kLast)
    80 IF rootK > rootKLast THEN GOTO 90
        81 RETURN 0
    90 DIM numerator, denominator, supply, liquidity_minted as Uint64
   100 LET supply = get_supply_per_asset(asset_address)
   110 LET numerator = supply*(rootK-rootKLast)
   120 LET denominator = rootK * 5 + rootKLast
   130 LET liquidity_minted = numerator / denominator
   140 IF liquidity_minted > 0 THEN GOTO 141 ELSE GOTO 150
       141 increase_provider_liquidity_by(feeTo, liquidity_minted, asset_address)
       142 set_supply_per_asset(supply + liquidity_minted, asset_address)
   150 RETURN 0
End Function
    
// babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
Function sqrt(y Uint64) Uint64
    10 IF y > 3 THEN GOTO 20 ELSE GOTO 90
    20 DIM x,z as Uint64
    30 LET z = y 
    40 LET x = y / 2 + 1
    50 IF x < z THEN GOTO 60 ELSE GOTO 130
    60 LET z = x
    70 LET x = (y / x + x) / 2
    80 GOTO 50
    90 IF y != 0 THEN GOTO 110 ELSE GOTO 120
   110 RETURN 1
   120 RETURN 0
   130 RETURN z
End Function

Function UpdateCode(code String) Uint64 
    10  IF LOAD("owner") == SIGNER() THEN GOTO 30 
    20  RETURN 1
    30  UPDATE_SC_CODE(code)
    40  RETURN 0
End Function
