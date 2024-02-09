const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');

const MAX_SERVICES = 8
const MIN_TIME = 2.5
const MAX_TIME = 7


class LoadManager {
  constructor() {
    this.requestTimes = [];
    this.averageTime = 0;
    this.scalingInterval = 30000; // Scaling interval 30 seconds
    this.serviceCount = 1;
    this.timeSinceStart = 0;

    this.pastServiceCount = [1] // default 1 service
    this.pastResponseTime = [0]
    this.pastWorkload = [0] 
    this.times = [0]


    // Start scaling interval
    setInterval(() => this.scaleServer(), this.scalingInterval);
  }


  receiveRequestTime(requestTime) {
    this.requestTimes.push(requestTime);
  }

  calculateAverageTime() {
    if(this.requestTimes.length == 0) {
      this.averageTime = 0
      this.pastWorkload.push(0);
      this.pastResponseTime.push(0);
      return;
    }

    const totalRequestTimes = this.requestTimes.reduce((sum, time) => sum + time, 0);
    this.averageTime = totalRequestTimes / this.requestTimes.length;
    this.pastResponseTime.push(this.averageTime);
    this.pastWorkload.push(this.requestTimes.length / 30); // 30 second scaling interval
  }

  scaleServer() {
    this.timeSinceStart += 0.5
    this.times.push(this.timeSinceStart)

    this.calculateAverageTime()
    this.requestTimes = [] // clear interval request times
    console.log(`Average request time: ${this.averageTime}`)

    if (this.averageTime > MAX_TIME && this.serviceCount < MAX_SERVICES) {
      console.log('Increasing server instances...')
      console.log('docker service scale app_name_web='+(this.serviceCount + 1))


      exec('docker service scale app_name_web='+(this.serviceCount + 1), (err, stdout, stderr) => {
        if (err) {
          console.log(err)
          return
        }
      });
      this.serviceCount +=1 

    }
    else if (this.averageTime < MIN_TIME && this.serviceCount > 1) {
      console.log('Decreasing server instances...');
      console.log('docker service scale app_name_web='+(this.serviceCount - 1))

      exec('docker service scale app_name_web='+(this.serviceCount - 1).toString(), (err, stdout, stderr) => {
        if (err) {
          console.log(err)
          return;
        }
      });
      this.serviceCount -=1
    }
    
    this.pastServiceCount.push(this.serviceCount);

    const data = {
      pastResponseTime: this.pastResponseTime,
      pastServiceCount: this.pastServiceCount,
      pastWorkload: this.pastWorkload,
      times: this.times
    };

    const jsonData = JSON.stringify(data, null);
    const filePath = 'data.json';


    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to JSON file:', err);
      }
      else {
        console.log(`JSON document has been created and saved to ${filePath}`);
      }
    });

    exec('python3 makeImage.py', (err, stdout, stderr) => {
      if (err) {
        console.log(err)
      }
    });
  }
}


function startup() {
  const filePath = 'data.json';

  const data = {
    pastResponseTime: [0],
    pastServiceCount: [1],
    pastWorkload: [0],
    times: [0]

  };
  const jsonData = JSON.stringify(data, null);

  exec('rm data.json', (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return;
    }
  });

  exec('touch data.json', (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return;
    }
  });

  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to JSON file:', err);
    } else {
      console.log(`STARTUP: JSON document has been created and saved to ${filePath}`);
    }
  });
    
  exec('python3 makeImage.py', (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return;
    }
  });
}

// Create an instance of the LoadBalancer class
const loadManager = new LoadManager();

// Create an Express app
const app = express();
app.use(express.json())
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to receive request times
app.post('/request-time', (req, res) => {
  requestTime = req.body.time;
  if (typeof requestTime === 'number') {
    loadManager.receiveRequestTime(requestTime);
    res.status(200).json({ message: 'Request time received successfully' });
  } else {
    res.status(400).json({ message: 'Invalid request time' });
  }
});

// Start the Express server
app.listen(port, () => {
  startup(); // clean up function
  console.log(`Server is running on port ${port}`);
});
