# Register.it-Dynamic-DNS-Updater
Allows the dynamic updating of all the existing record, of any type, that is managed by register.it

# 2019 Update

Due to security change on the Register site the python script won't works anymore.

I suggest you to use the new node solution implemented with Puppeter.
Clone this repo and make an `cd node && npm install`.

Make sure to have Crhome installed and Node v. > 6.

Then you can run the script typing:
`node index.js --username=USERNAME_HERE --password=SECRET_PWD --domain=DOMAIN --name=RECORD_NAME --value=RECORD_VALUE --ttl=TTL_>_600 --type=RECORD_TYPE
`

**Note** that RECORD_TYPE can be one of the following values: NS, A, CNAME, MX, TXT, SRV, AAAA.

I made a few test, if you find something strange open an issue, please.

Test case soon.

# Dynamic DNS for register.it

This script make some request to register.it admin pages by using python and requests library. 

## What can you do with this script?

  - Dynamic update of all existing record (all type es. A, MX, CNAME)
  - Update TTL
  - Using in crontab for multiple account and multiple domain

Actually, I'm using Python2.7, but will be fine using 3.0

## Dependencies
  - import re, sys, getopt, requests, json
  - bs4 from BeautifulSoup
  - urllib2 from urlopen


### Installation

We need to install BeautifulSoup first. Let's get it from pip:

```sh
$ sudo pip install beautifulsoup4
```

### Usage

We need to define all the parameters before starting the script, so:
```sh
/usr/bin/python dns.py -u username -p secretpsw -d domain.net -t A -v 192.168.1.1
```
Note: For help you can use -h. The parameters -v is your public ip address by default.

### Todos

 - Convert in php
 - Add more modules
 - Create "api" for register.it


I do not assume any responsibilities for the use of this script.
