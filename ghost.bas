
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
    01 DIM total_liquidity, dero_reserve, asset_reserve, asset_amount, liquidity_minted, dero_deposited, asset_deposited, SYS_MAX_VALUE as Uint64
    02 LET SYS_MAX_VALUE = 18446744073709551 // Uint64.Max/1000 to protect from infinite supply tokens
    03 LET dero_deposited = DEROVALUE()
    04 LET asset_deposited = ASSETVALUE(HEXDECODE(asset_address))
    10 IF (asset_deposited > 0 & dero_deposited > 0 ) THEN GOTO 30
    20 GOTO 666
    30 LET total_liquidity =  get_supply_per_asset(asset_address) 
    // Pair already exists
    40 IF total_liquidity > 0 THEN GOTO 41 ELSE GOTO 60
        41 IF min_liquidity > 0 THEN GOTO 43
        42 GOTO 666  
        43 LET dero_reserve = get_dero_reserve_per_asset(asset_address) 
        44 LET asset_reserve = get_asset_reserve(asset_address)
        45 IF will_addition_overflow(asset_reserve, asset_deposited) == 1 THEN GOTO 666
        46 mintFee(dero_reserve, asset_reserve, asset_address)
        47 LET total_liquidity = get_supply_per_asset(asset_address) // Must be defined again since totalSupply can update in mintFee
        48 LET asset_amount =   mult_div(dero_deposited, asset_reserve , dero_reserve + 1)
        49 LET liquidity_minted = mult_div(dero_deposited, total_liquidity, dero_reserve)
        50 IF asset_deposited >= asset_amount & liquidity_minted >= min_liquidity & (asset_reserve + asset_deposited <= SYS_MAX_VALUE) THEN GOTO 52
        51 GOTO 666
        52 increase_provider_liquidity_by(SIGNER(), liquidity_minted, asset_address) 
        53 set_supply_per_asset(total_liquidity + liquidity_minted, asset_address)
        54 IF asset_deposited == asset_amount THEN GOTO 56
        // Return any reminding assets
        55 SEND_ASSET_TO_ADDRESS(SIGNER(), asset_deposited - asset_amount, HEXDECODE(asset_address))
        // Increase the dero reserve record for this asset
        56 set_dero_reserve_per_asset(dero_reserve + dero_deposited, asset_address)
        // Increase the asset reserve record
        57 set_asset_reserve(asset_reserve + asset_amount, asset_address)
        58 STORE(asset_address+":kLast",  (dero_reserve + dero_deposited) * (asset_reserve + asset_amount))
        // Return gracefully
        59 GOTO 70
    // else
    // Creating pair  
    60 IF dero_deposited >= 1000 & asset_deposited <= SYS_MAX_VALUE THEN GOTO 62
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
   100  LET dero_amount  = mult_div(amount, dero_reserve, total_liquidity)
   110  LET asset_amount = mult_div(amount, asset_reserve, total_liquidity)
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
    01 DIM SYS_MAX_VALUE as Uint64
    02 LET SYS_MAX_VALUE = 18446744073709551
    10 IF input_reserve > 0 & output_reserve > 0 & input_amount <= SYS_MAX_VALUE THEN GOTO 30
    20 PANIC
    30 DIM input_amount_with_fee as Uint64
    40 LET input_amount_with_fee = input_amount * 997
    50 IF will_addition_overflow(input_reserve * 1000, input_amount * 1000) == 0 THEN GOTO 70
    60 PANIC // Infinite supply token attack
    70 RETURN mult_div(input_amount_with_fee, output_reserve, (input_reserve * 1000) + input_amount_with_fee)
End Function

// Pricing function for converting between DERO & Assets.
// {output_amount} Amount of DERO or Assets being bought.
// {input_reserve} Amount of DERO or Assets (input type) in exchange reserves.
// {output_reserve} Amount of DERO or Assets (output type) in exchange reserves.
Function getOutputPrice(output_amount Uint64, input_reserve Uint64, output_reserve Uint64) Uint64
    10 IF input_reserve > 0 & output_reserve > 0 & output_reserve > output_amount THEN GOTO 30
    20 PANIC
    30 DIM numerator, denominator as Uint64
    40 RETURN mult_div(input_reserve * 1000, output_amount, (output_reserve - output_amount) * 997 + 1)
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

Function will_addition_overflow(a Uint64, b Uint64) Uint64
    10 IF (a > 18446744073709551615 - b) THEN GOTO 100
    20 RETURN 0 // No overflow
    100 RETURN 1 // Overflow
End Function

// From Pieswap
// lossless (a * b ) / c
Function mult_div(a Uint64, b Uint64, c Uint64) Uint64
	10 DIM base, maxdiv AS Uint64
	20 LET base = 4294967296	// (1<<32)
	30 LET maxdiv = (base-1)*base + (base-1)

	50 DIM res AS Uint64
	60 LET res = (a/c) * b + (a%c) * (b/c)
	70 LET a = a % c
	80 LET b = b % c
	90 IF (a == 0 || b == 0) THEN GOTO 1000

	100 IF (c >= base) THEN GOTO 200
	110 LET res = res + (a*b/c)
	120 GOTO 1000

	200 DIM norm AS Uint64
	210 LET norm = maxdiv/c
	220 LET c = c * norm
	230 LET a = a * norm

	300 DIM ah, al, bh, bl, ch, cl AS Uint64
	310 LET ah = a / base
	320 LET al = a % base
	330 LET bh = b / base
	340 LET bl = b % base
	350 LET ch = c / base
	360 LET cl = c % base

	400 DIM p0, p1, p2 AS Uint64
	410 LET p0 = al*bl
	420 LET p1 = p0 / base + al*bh
	430 LET p0 = p0 % base
	440 LET p2 = p1 / base + ah*bh
	450 LET p1 = (p1 % base) + ah*bl
	460 LET p2 = p2 + p1 / base
	470 LET p1 = p1 % base

	500 DIM q0, q1, rhat AS Uint64
	510 LET p2 = p2 % c
	520 LET q1 = p2 / ch
	530 LET rhat = p2 % ch

	600 IF (q1 < base && (rhat >= base || q1*cl <= rhat*base+p1)) THEN GOTO 700
	610 LET q1 = q1 - 1
	620 LET rhat = rhat + ch
	630 GOTO 600

	700 LET p1 = ((p2 % base) * base + p1) - q1 * cl
	710 LET p2 = (p2 / base * base + p1 / base) - q1 * ch
	720 LET p1 = (p1 % base) + (p2 % base) * base
	730 LET q0 = p1 / ch
	740 LET rhat = p1 % ch

	800 IF (q0 < base && (rhat >= base || q0*cl <= rhat*base+p0)) THEN GOTO 900
	810 LET q0 = q0 - 1
	820 LET rhat = rhat + ch
	830 GOTO 800

	900 LET res = res + q0 + q1 * base

	1000 RETURN res
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
