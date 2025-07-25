# Malaysia Election DApp

A decentralized application (DApp) for managing elections, built with Next.js (frontend) and Hardhat (smart contracts).

---

## 🚀 Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd malaysia-election-dapp
```

---

### 2. Install Dependencies

#### For the Frontend (Next.js/React & Hardhat)
```sh
cd frontend
npm install
```

---

### 3. Running the Frontend

```sh
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 4. Using Hardhat (Smart Contracts)

#### Compile Contracts
```sh
npx hardhat compile
```

#### Run Tests
```sh
npx hardhat test
```

#### Start Local Hardhat Node
```sh
npx hardhat node
```

#### Deploy Contracts to Local Node
Open a new terminal in the `frontend` directory:
```sh
npx hardhat run scripts/deploy.js --network localhost
```

---

### 5. Setting Up MetaMask

1. **Install MetaMask**: [MetaMask Extension](https://metamask.io/)
2. **Connect to Local Network**:
   - Open MetaMask
   - Click the network dropdown > Add Network
   - Use:
     - Network Name: Hardhat Localhost
     - New RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH
3. **Import an Account**:
   - When you run `npx hardhat node`, it prints accounts & private keys.
   - In MetaMask: Account icon > Import Account > paste a private key from Hardhat output.

---

### 6. Summary Table

| Step                | Command/Action                                      |
|---------------------|-----------------------------------------------------|
| Clone repo          | `git clone ...`                                     |
| Install deps        | `cd frontend && npm install`                        |
| Start frontend      | `npm run dev`                                       |
| Compile contracts   | `npx hardhat compile`                               |
| Start local node    | `npx hardhat node`                                  |
| Deploy contracts    | `npx hardhat run scripts/deploy.js --network localhost` |
| Setup MetaMask      | Add local network, import account                   |

---

## 📦 Project Structure

- `frontend/` - Next.js frontend & Hardhat contracts
- `frontend/contracts/` - Solidity smart contracts
- `frontend/scripts/` - Deployment scripts
- `frontend/src/` - Frontend source code

---

## 📄 License

Specify your license here (e.g., MIT, GPL, etc.)
