#!/usr/bin/env bash

#set -x   # to enable debug and verbose printing of each and every command

# the SC will trigger panic and but cannot return the funds to sender since ringsize > 2, instead deposits to SC

CURDIR=`/bin/pwd`
BASEDIR=$(dirname $0)
ABSPATH=$(readlink -f $0)
ABSDIR=$(dirname $ABSPATH)

command -v curl >/dev/null 2>&1 || { echo "I require curl but it's not installed.  Aborting." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "I require jq but it's not installed.  Aborting." >&2; exit 1; }

baseasset="0000000000000000000000000000000000000000000000000000000000000000"

daemon_rpc_port="20000"  # daemon rpc is listening on this port

function balance(){
  	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getbalance"}' -H 'Content-Type: application/json'| jq -r ".result.balance"
}

function scassetbalance(){
  	curl --silent http://127.0.0.1:$daemon_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getsc","params":{ "scid":"'"$1"'" , "code":false, "variables":true}}' -H 'Content-Type: application/json'| jq -r '.result.balances."'$2'"'
}

function tokenbalance(){
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getbalance" , "params":{ "scid":"'"$2"'" }}' -H 'Content-Type: application/json'| jq -r ".result.balance"
}

owner_rpc_port="30000"
user1_rpc_port="30001"
user2_rpc_port="30002"

owner_address=$(curl --silent http://127.0.0.1:$owner_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getaddress"}' -H 'Content-Type: application/json'| jq -r ".result.address")
user1_address=$(curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getaddress"}' -H 'Content-Type: application/json'| jq -r ".result.address")
user2_address=$(curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getaddress"}' -H 'Content-Type: application/json'| jq -r ".result.address")

echo "owner address" $owner_address
echo "user1 address" $user1_address
echo "user2 address" $user2_address

# use owner wallet to load/install an Ghost sc to chain
ghostscid=$(curl --silent --request POST --data-binary   @ghost.bas http://127.0.0.1:$owner_rpc_port/install_sc| jq -r ".txid")
echo "Ghost SCID" $ghostscid
sleep 2

asset1scid=$(curl --silent --request POST --data-binary   @asset.bas http://127.0.0.1:$owner_rpc_port/install_sc| jq -r ".txid")
echo "asset1 SCID" $asset1scid
sleep 2


asset2scid=$(curl --silent --request POST --data-binary   @asset.bas http://127.0.0.1:$owner_rpc_port/install_sc| jq -r ".txid")
echo "asset2 SCID" $asset2scid
sleep 2


echo -n "user 1 minting 100000 asset1 "
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":100000,"scid":"'"$asset1scid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"IssueAsset"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 minting 100000 asset1 "
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":100000,"scid":"'"$asset1scid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"IssueAsset"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 creating trading pair for asset1 "
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":1234,"destination":"'"$user2_address"'"},{"scid":"'"$asset1scid"'", "burn":1234}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 doubling liquidity for the asset1 pair"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":1234,"destination":"'"$user2_address"'"},{"scid":"'"$asset1scid"'", "burn":5000}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 adding liquidity for the asset1 pair"
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":1234,"destination":"'"$user1_address"'"},{"scid":"'"$asset1scid"'", "burn":5000}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 removing all liquidity for the asset1 pair"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"RemoveLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"amount","datatype":"U","value":2468},{"name":"min_dero","datatype":"U","value":1},{"name":"min_assets","datatype":"U","value":1}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 removing all liquidity for the asset1 pair"
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"RemoveLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"amount","datatype":"U","value":1234},{"name":"min_dero","datatype":"U","value":1},{"name":"min_assets","datatype":"U","value":1}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

printf "rebuilding liquidity for asset1"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":10000,"destination":"'"$user2_address"'"},{"scid":"'"$asset1scid"'", "burn":10000}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset1scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":1234,"destination":"'"$user1_address"'"},{"scid":"'"$asset1scid"'", "burn":5000}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 exchanging 100000 dero for asset2 "
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":100000,"scid":"'"$asset2scid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"IssueAsset"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 exchanging 100000 dero for asset2 "
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":100000,"scid":"'"$asset2scid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"IssueAsset"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "building liquidity for asset2";
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":10000,"destination":"'"$user2_address"'"},{"scid":"'"$asset2scid"'", "burn":10000}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AddLiquidity"},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"},{"name":"min_liquidity","datatype":"U","value":1}], "transfers": [{"burn":1234,"destination":"'"$user1_address"'"},{"scid":"'"$asset2scid"'", "burn":5000}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 swaps 1000 dero for asset2 "
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":1000,"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeroToAssetSwapInput"},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 swaps 5000 dero for asset2 "
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":5000,"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeroToAssetSwapInput"},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "Fails when user 1 swaps 1000 dero for asset2 and receives less than the min specified"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":1000,"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeroToAssetSwapInputMin"},{"name":"min_assets","datatype":"U","value":402},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 swaps 1000 dero for asset2 specifying min assets to receive"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":1000,"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeroToAssetSwapInputMin"},{"name":"min_assets","datatype":"U","value":401},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "Fails when user 1 buys 100 asset2 and pays more dero than the max specified"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":267,"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeroToAssetSwapOutput"},{"name":"assets_bought","datatype":"U","value":100},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 1 buys 100 asset2 specifying max dero to pay"
curl --silent http://127.0.0.1:$user1_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":268,"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeroToAssetSwapOutput"},{"name":"assets_bought","datatype":"U","value":100},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "Fails when user 2 sells 100 asset2 and receives less than the min specified"
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AssetToDeroSwapInput"},{"name":"min_dero","datatype":"U","value":267},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}], "transfers": [{"scid":"'"$asset2scid"'", "burn":100}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 sells 100 asset2 specifying min dero to receive"
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AssetToDeroSwapInput"},{"name":"min_dero","datatype":"U","value":266},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}], "transfers": [{"scid":"'"$asset2scid"'", "burn":100}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "fails when user 2 spends more than the max of asset2 specified for sell to receive a specific dero amount"
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AssetToDeroSwapOutput"},{"name":"dero_bought","datatype":"U","value":100},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}], "transfers": [{"scid":"'"$asset2scid"'", "burn":38}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo -n "user 2 specifies a max of asset2 to sell to receive a specific dero amount"
curl --silent http://127.0.0.1:$user2_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"transfer","params":{"scid":"'"$ghostscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"AssetToDeroSwapOutput"},{"name":"dero_bought","datatype":"U","value":100},{"name":"asset_address","datatype":"S","value":"'"$asset2scid"'"}], "transfers": [{"scid":"'"$asset2scid"'", "burn":39}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
sleep 2

echo "SC DERO balance" $(scassetbalance $ghostscid $baseasset )
echo "SC Asset1 balance" $(scassetbalance $ghostscid $asset1scid )
echo "SC Asset2 balance" $(scassetbalance $ghostscid $asset2scid )

exit 0