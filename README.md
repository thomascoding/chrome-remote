# Run container

docker run --name chrome-remote --network=host --rm --tmpfs /var/cache --tmpfs /tmp --tmpfs /root thomascoding/chrome-remote

# API Usage:

## Launch browser

**/launch**  - launches new browser and return websocket connection port in json

You can add launch flash with args query

**/launch?args[]=--lang=en-US**

## Stop all browsers

**/killall**  - close all browsers

## JS example

        const puppeteer = require('puppeteer');  
        const axios = require('axios');  
        const remoteBrowserHost = 'parser.local';
        
        async function launchBrowser() {  
            try {  
                let resp = await axios.get('http://' + remoteBrowserHost + ':3000/launch', {  
                    params: {  
                        args: [  
                            '--lang=en-US,en'  
    				    ]  
                    }  
                });  
    
            return  await puppeteer.connect({  
                    browserWSEndpoint: 'ws://' + remoteBrowserHost + ':' + resp.data.browserWSPort  
                });  
          
          } catch (e) {  
                console.error('Connection error')  
          }  
        }
