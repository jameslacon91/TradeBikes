// This script is used to override the default deployment
// It will be executed instead of the default deployment script
import { exec } from "child_process";

console.log("Starting TradeBikes production deployment...");

// Run the deployment script
exec("NODE_ENV=production tsx server/deploy.ts", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing deployment: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Deployment stderr: ${stderr}`);
  }
  
  console.log(`Deployment output: ${stdout}`);
});