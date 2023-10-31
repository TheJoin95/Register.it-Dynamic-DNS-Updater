const puppeteer = require('puppeteer-extra');
const pluginStealth = require("puppeteer-extra-plugin-stealth");

if (process.argv.includes('--help') || process.argv.includes('-h')) {
	console.log(`Create, update or delete DNS records on Register.it

Usage: node index.js args

Args:
  --username=USERNAME      	register.it username
  --password=PWD           	register.it password
  --domain=DOMAIN          	domain of the dns to modify
  --name=RECORD_NAME       	name of the record to create/update/delete
  [--value=RECORD_VALUE]   	new value for the created/updated record
  [--ttl=TTL_>_600]        	new ttl for the created/updated record
  [--type=RECORD_TYPE]     	new type for the created/updated record
  [--oldvalue=RECORD_VALUE]	old value in the record to be updated/deleted
  [--debug]                	take screenshot during the process
  [--headless]          	do not start browser in headless mode
  [--proxy=proxy-server]   	proxy to use to connect to register.it
`);
	return false;
}


puppeteer.use(pluginStealth());

const args = {};
process.argv.slice(2).map(function (val) {
		let splitted = val.split('=');
		if(splitted[0].search('--') !== -1)
			args[splitted[0].replace('--', '')] = splitted[1];
	}
);

const defaultUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';
const LOGIN_URL = 'https://controlpanel.register.it/index.html';
const DOMAIN_URL = 'https://controlpanel.register.it/firstLevel/view.html?domain=';
const DNS_ADVANCED_URL = 'https://controlpanel.register.it/domains/dnsAdvanced.html';

const availableRecordType = [
	"NS",
	"A",
	"CNAME",
	"MX",
	"TXT",
	"SRV",
	"AAAA"
];

if(
		args['username'] == '' || args['username'] == undefined ||
		args['password'] == '' || args['password'] == undefined ||
		args['name'] == '' || args['name'] == undefined ||
		args['value'] == '' || args['value'] == undefined ||
		args['domain'] == '' || args['domain'] == undefined
	) {
	console.log('Error: invalid params. You need to specify: --username, --password, --name, --value, --domain, --type, --ttl');
	return false;
}

const domain = args['domain'];
const record = {};

record['name'] = args['name'];
record['type'] = args['type'];
record['value'] = args['value'];
record['ttl'] = parseInt(args['ttl']);

if(availableRecordType.indexOf(record['type']) === -1) {
	console.log('Error on type: type not allowed');
	return false;
}

if(args['oldvalue'] !== undefined && args['oldvalue'] != '')
	record['oldValue'] = args['oldvalue'];

if(parseInt(args['ttl']) < 600){
	console.log("Error on ttl: only ttl > 600");
	return false;
}


async function inputClear(page, selector) {
  await page.evaluate(selector => {
    document.querySelector(selector).value = "";
  }, selector);
}

async function takeScreenshot(page, options) {
	if(Object.keys(args).indexOf('debug') !== -1)
		await page.screenshot(options);
}

(async () => {

	const puppeteerConfig = {
  	headless: (Object.keys(args).indexOf('headless') === -1),
  	defaultViewport: {
  		width: 1600,
  		height: 900
  	}
	};

	if(args['proxy'] !== undefined) {
		console.log('Setting proxy ' + args['proxy']);
		puppeteerConfig['args'] = [
      '--proxy-server=' + args['proxy']
    ];
	}

  const browser = await puppeteer.launch(puppeteerConfig);

  const page = await browser.newPage();
  await page.setUserAgent(defaultUA);
  // await page.setJavaScriptEnabled(false);
  
  console.log('Loading login page');
  await page.goto(LOGIN_URL);
  await page.waitForTimeout(5000);

  await page.click('button[class="iubenda-cs-accept-btn iubenda-cs-btn-primary"]');
  await page.waitForTimeout(1000);

  await page.click('.text-center.title-xs');
  await page.waitForTimeout(1000);

  console.log('Faking user interaction..');
  await page.evaluate(async () => {
	  await new Promise((resolve, reject) => {
	  	// Math.floor(Math.random() * 90)
	  	document.elementFromPoint(90, 80).click();
	  	var counter = Math.floor(Math.random() * 20) + 10;
	  	var iterator = 0;
      var timer = setInterval(() => {
          window.scrollBy(0, Math.floor(Math.random() * 60) + 40);
          iterator++;
          if(iterator >= counter){
              clearInterval(timer);
              resolve();
          }
      }, 400);
    });
  });
  
  console.log('Compiling login form data..');
  await page.type('.standard-login-module [name="userName"]', args['username'], {delay: 90});
  await page.type('.standard-login-module [name="password"]', args['password'], {delay: 90});
  console.log('Submit login form..');
  await page.click('.welcome-container-block .standard-login-area [type="submit"]');
  
  var errorOnLogin = false;

  takeScreenshot(page, {path: 'before-login.png'});
  await page.waitForNavigation().then(() => console.log('Logged in succesfully'), (err) => { errorOnLogin = true; console.log('Error on submit');});
  // await page.screenshot({path: 'login.png'});

  if(errorOnLogin === false) {
		// await page.setJavaScriptEnabled(true);
  	console.log('Loading detail page for the domain: ' + domain);
	  await page.goto(DOMAIN_URL + domain);
	  await page.waitForTimeout(2000);
	  takeScreenshot(page, {path: 'doman-page.png'});

	  console.log('Loading dns advanced page..');
	  await page.goto(DNS_ADVANCED_URL);
	  await page.waitForTimeout(2000);
	  await page.evaluate( () => {
			window.scrollBy(0, window.innerHeight);
	  });
	  await page.waitForTimeout(200);
	  await page.evaluate( () => {
			window.scrollBy(0, window.innerHeight);
	  });
	  await page.waitForTimeout(200);

	  takeScreenshot(page, {path: 'dns-advanced.png'});

	  var indexToUpdate = null;
	  var recordCounter = await page.$$(".recordName");
	  recordCounter = recordCounter.length;

	  if(record.oldValue !== undefined && record.oldValue !== "") {
	  	const recordNames = await page.$$(".recordName");
	  	const recordValues = await page.$$(".recordValue");
	  	for(let i in recordNames) {
	  		let elName = await recordNames[i].getProperty('value');
	  		elName = await elName.jsonValue();
	  		let elOldValue = await recordValues[i].getProperty('value');
	  		elOldValue = await elOldValue.jsonValue();
	  		
	  		if(elName == record.name && record.oldValue == elOldValue) {
	  			indexToUpdate = i;

			  	if(record.value !== undefined){
			  		await inputClear(page,'[name="recordValue_' + indexToUpdate + '"]');
			  		await page.type('[name="recordValue_' + indexToUpdate + '"]', record.value);
			  	}
			  	
			  	if(record.type !== undefined){
			  		await inputClear(page,'[name="recordType_' + indexToUpdate + '"]');
			  		await page.select('[name="recordType_' + indexToUpdate + '"]', record.type);
			  	}
			  	
			  	if(record.ttl !== undefined){
			  		await inputClear(page,'[name="recordTTL_' + indexToUpdate + '"]');
			  		await page.type('[name="recordTTL_' + indexToUpdate + '"]', record.ttl);
			  	}
	  			
	  			break;
	  		}
	  	}
	  }

	  if(indexToUpdate == null) {
		await page.waitForTimeout(200);
	  	await page.click('.btn.add').catch((err) => console.log('No add button found. Please, enable --debug flag'));
		await page.waitForTimeout(200);

	  	var newRecordCounter = recordCounter;
	  	try {
		  	await page.type('[name="recordName_' + newRecordCounter + '"]', record.name);
		  	await page.type('[name="recordValue_' + newRecordCounter + '"]', record.value);
		  	await page.select('[name="recordType_' + newRecordCounter + '"]', record.type);
		  	await page.type('[name="recordTTL_' + newRecordCounter + '"]', record.ttl.toString());
	  	}catch(err) {
	  		console.log('Something went wrong on adding a new DNS record. Please, enable --debug');
	  	}
	  }
		
		console.log('Updating..');
	 	await page.click('.submit.btn');
	 	takeScreenshot(page, {path: 'before-applybtn.png', fullPage: true});
	 	await page.waitForTimeout(2000);

	 	// await page.screenshot({path: 'printbtn.png', fullPage: true});
	 	await page.click('.pribttn.nm.apply').then(
	 		() => console.log('Operation succeded'),
	 		(err) => console.log('Operation failed')
 		);

	 	await page.waitForTimeout(2000);
		takeScreenshot(page, {path: 'updated.png'});
		await page.waitForTimeout(200);
  }

  console.log('Window close');
  await browser.close();
})();
