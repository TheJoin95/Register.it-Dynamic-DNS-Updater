#!/usr/bin/python

#author: thejoin

import re, sys, getopt, requests, json
from bs4 import BeautifulSoup
from urllib2 import urlopen

session = requests.Session()
session.cookies.get_dict()


def login(usr, psw):

    url = 'https://controlpanel.register.it/index.html'

    form_data = {
        'userName': usr,
        'password': psw,
        'submit': 'Accedi',
	'logged': 'on'
    }

    response = session.post(url, data=form_data)

    #print session.cookies.get_dict()    

    response = session.get('https://www.register.it')
    cookie = session.cookies.get_dict()

    isLogged = cookie['cpIsLogged'] == '1LevelLogged'

    return "Logged: " + str(isLogged)


def selectDomain(domain):

   url = 'https://controlpanel.register.it/firstLevel/view.html?domain='+domain
   
   response = session.get(url)

   return "Domain selected: " + str(response.status_code == 200)

def changeDNS(recordName, recordType, newValue):

	urlGet = 'https://controlpanel.register.it/domains/dnsAdvanced.html'
	urlPost = 'https://controlpanel.register.it/domains/dnsAdvanced.html'

	regexDoubleQuotes = r"([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:"

	pageDNS = session.get(urlGet)
   
        print "request for dns page: " + str(pageDNS.status_code == 200)    
   
	if pageDNS.status_code == 200:

		data = pageDNS.text
		soup = BeautifulSoup(data, "html.parser")
		idVal = ""

                pattern = re.compile(r"ret\.async\.onLoad\((.*)\)")

                script = soup.find("script", text=pattern)

		if script:
			match = pattern.search(script.text)
			data = match.groups(1)[0]
			
			data = re.sub(regexDoubleQuotes, r'\1\2"\3":', data)			

		#	print data
			data = json.loads(data)

			
			entryIndex = 0
			entryIndexVal = 0
			for entry in data['dnsConfiguration']:
				if entry['TYPE'] == recordType and entry['NAME'] == recordName:
					idVal = entry['ID']
					entryIndexVal = entryIndex

				entryIndex += 1
		
		# preparing all the data for register. I know, it's ugly.
		form_data = {
			'conf': '{"change":{"'+ str(entryIndexVal)+'":{"NAME":"'+recordName+'","VALUE":"'+newValue+'","TYPE":"'+recordType+'","STATE":"","LASTMODIFIED":"","TTL":"900","ID":"'+str(idVal)+'"}}}',
			'ttls': '{"lower":600,"upper":604800,"zone":900,"default":900}',
			'action': 'change'
		}

		
		cookies = session.cookies.get_dict()
		
		response = session.post(urlPost, data=form_data, cookies=cookies)
		print "saved"


if __name__ == '__main__':

	argv = sys.argv[1:]
	
	usr = ''
	psw = ''
	domain = ''
	recordType = 'A'
	newValue = urlopen('http://ip.42.pl/raw').read()

	try:
  		opts, args = getopt.getopt(argv,"hi:o:u:p:d:t:v",["usr=","psw=", "domain=", "recordType=", "value="])
	except getopt.GetoptError:
  		print 'dns_register.py -u <usr> -p <psw> -d <domain> -t <recordType> -v <value>'
  		sys.exit(2)
	for opt, arg in opts:
  		if opt == '-h':
     			print 'dns.py -u <usr> -p <psw> -d <domain> -t <recordType> -v <value>'
     			sys.exit()
  		elif opt in ("-u", "--user"):
     			usr = arg
  		elif opt in ("-p", "--password"):
     			psw = arg
  		elif opt in ("-d", "--domain"):
     			domain = arg
  		elif opt in ("-t", "--recordType"):
     			recordType = arg
  		elif opt in ("-v", "--value"):
    			 newValue = arg

	if usr != "" and psw != "" and domain != "":

    		print login(usr,psw)
    		print selectDomain(domain)
    		changeDNS(domain+'.',recordType, newValue)
