   // frontend/scripts/deploy.js
   const hre = require("hardhat");

   async function main() {
     const commitDuration = 3600; // 1 hour (example)
     const revealDuration = 3600; // 1 hour (example)

     const Election = await hre.ethers.getContractFactory("Election");
     const election = await Election.deploy(commitDuration, revealDuration);

     await election.waitForDeployment();

     console.log("Election deployed to:", election.target);
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
