# WebCoin
Weekend tryout making own PoSV-based coin with no transaction history

# How to run the dev version
This guide assumes you have NodeJS installed (see:https://nodejs.org/en)

- clone this project
- `cd` to the project and run `npm install`
- run `npm run dev` and wait for the window to pop up
- you can run an additional peer by running `npm run peer` in another terminal (from the project directory)
  - In the console you get a peer ID, you can manually connect to your second peer using the wallet test gui. There is not automatic peer-discovery as of now, as I first wanted to see the cryptography behind it working.

There is a test wallet file int he pre-pro directory that you can open to get 1 million WebCoins to try out while it's alpha :)

# Roadmap
Please note that WebCoin is heavily alpha, in fact you can't even call it that. This is started as a weekend project to build my own cryptocurrency in just 2 days. The biggest priority was that the cryptography behind it worked. After that, I move to other things, like writing tests.

- implement elliptic curve with secp256k1 (for it's awesome properties such as public key recovery when verifying signatures)
- implement peer-discovery (with DHT, for instance)
- clock synchronization
