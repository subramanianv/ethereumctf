var Web3 = require('web3')
var fs = require("fs")
var solc = require('solc')

var web3 = new Web3()
function deployContract(contractFromSolc, contractArgs, callback) {

      var abi = JSON.parse(contractFromSolc.interface)
      var code = '0x' + contractFromSolc.bytecode
      var MyContract = new web3.eth.Contract(abi)

      MyContract.deploy({
        data: code,
        arguments: contractArgs
      }).send({
        from: "0x1da7e787a1897046677e57e87177c4de88cc388a",
        gas: 1500000
      }).then(function (instance) { callback(instance) })
}

// TODO: Run its own provider
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545/'))

// solc Vulnerable.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > contracts.json

fs.readdir("challenges/", function(err, items) {
  for(var i = 0; i < items.length; i++) {
    var path = "challenges/" + items[i]
    if (!fs.lstatSync(path).isDirectory()) {
      continue // Skip if not a directory
    }

    var input = {
        'vulnerable.sol': fs.readFileSync(path + "/vulnerable.sol", "utf8"),
        'test.sol': fs.readFileSync(path + "/test.sol", "utf8")
    }

    var source = solc.compile({ sources: input })
    var contracts = source["contracts"]

    var vulnerableAddress
    for (var contractName in contracts) {
      if (contractName == "test.sol:Test") {
        console.log("[In for loop] Skipping: " + contractName)
        continue;
      }
      console.log("[In for loop] Deploying: " + contractName)
      contractArgs = []

      deployContract(contracts[contractName], contractArgs, function(instance) {
        console.log('[In for loop] contract mined! address: ' + instance.options.address)
        vulnerableAddress = instance.options.address
      }) // deployContract

    } // for loop

    // Do test.sol last.
    var testContractName = "test.sol:Test"
    console.log("[Outside for loop] Deploying: " + contractName)

    contractArgs = [vulnerableAddress]

    deployContract(contracts[testContractName ], contractArgs, function(instance) {
      console.log('[Outside for loop] contract mined! address: ' + instance.options.address)
      vulnerableAddress = instance.options.address
    }) // deployContract

  } //for loop

}) // fs.readdir

