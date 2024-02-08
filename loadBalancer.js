const express = require('express');
const bodyParser = require('body-parser');

class LoadManager {
  constructor() {
    this.requestTimes = [];
    this.averageTime = 0;
    this.scalingInterval = 5000; // Scaling interval in milliseconds (default: 5 seconds)
    this.serviceCount = 1;

    // Start scaling interval
    setInterval(() => this.scaleServer(), this.scalingInterval);
  }

  receiveRequestTime(requestTime) {
    this.requestTimes.push(requestTime);
    this.calculateAverageTime();
  }

  calculateAverageTime() {
    const totalRequestTimes = this.requestTimes.reduce((sum, time) => sum + time, 0);
    this.averageTime = totalRequestTimes / this.requestTimes.length;
  }

  scaleServer() {
    // Implement server scaling logic based on average request time
    // You can add your scaling logic here, e.g., adjusting the number of server instances

    console.log(`Scaling server based on average request time: ${this.averageTime}`);
    // Example: Increase server instances if average time is high, decrease if low
    // Add your own logic as needed
    if (this.averageTime > 10 && this.serviceCount < 9) {
      console.log('Increasing server instances...');
      this.averageTime = []
      console.log('docker service scale my_app_web'+(this.serviceCount + 1))
      const { exec } = require('child_process');
      exec('docker service scale my_app_web='+(this.serviceCount + 1), (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          console.log(err)
          return;
        }
      
        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
      this.serviceCount +=1 


    }
    else if (this.averageTime < 3 && this.requestTimes.length > 10 && this.serviceCount > 1) {
      console.log('Decreasing server instances...');
      this.averageTime = []
      console.log('docker service scale my_app_web='+(this.serviceCount - 1))
      const { exec } = require('child_process');
      exec('docker service scale my_app_web='+(this.serviceCount - 1).toString(), (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          console.log(err)
          return;
        }
      
        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
      this.serviceCount -=1


    }
    
    // Clear request times for the next interval
    // this.requestTimes = []; -> change
  }
}

// Create an instance of the LoadBalancer class
const loadManager = new LoadManager();

// Create an Express app
const app = express();
app.use(express.json())
const port = 3000; // is this being used

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to receive request times
app.post('/request-time', (req, res) => {
  console.log(req.headers['x-forwarded-for'] || req.socket.remoteAddress)
  requestTime = req.body.time;
  if (typeof requestTime === 'number') {
    loadManager.receiveRequestTime(requestTime);
    res.status(200).json({ message: 'Request time received successfully' });
  } else {
    res.status(400).json({ message: 'Invalid request time' });
  }
});

app.get('/display-message', (req, res) => {
  console.log("Kokand Bol")
  res.send('cock n balls');
});

// app.post

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
