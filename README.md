# Register.it-Dynamic-DNS-Updater
Allows the dynamic updating of all the existing record, of any type, that is managed by register.it

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
