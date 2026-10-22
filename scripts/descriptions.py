"""Enrich catalog with the public list-item descriptions, without accessing Pro source."""
import json,urllib.request,concurrent.futures
from html.parser import HTMLParser
class Items(HTMLParser):
 def __init__(self):super().__init__();self.depth=0;self.text='';self.href='';self.items={}
 def handle_starttag(self,t,a):
  if t=='li':
   if not self.depth:self.text='';self.href=''
   self.depth+=1
  if t=='a' and self.depth and not self.href:self.href=dict(a).get('href','')
 def handle_data(self,d):
  if self.depth:self.text+=d+' '
 def handle_endtag(self,t):
  if t=='li':
   self.depth=max(0,self.depth-1)
   if not self.depth and self.href:
    text=' '.join(self.text.split())
    if len(text)>len(self.items.get(self.href,'')):self.items[self.href]=text
cats=json.load(open('src/data/catalog.json'))
def enrich(c):
 p=Items();p.feed(urllib.request.urlopen(c['reference'],timeout=45).read().decode())
 for b in c['blocks']:
  full=p.items.get(b['reference'].replace('https://reui.io',''),'')
  b['description']=full.removeprefix(b['name']).strip()
 return c
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:cats=list(pool.map(enrich,cats))
open('src/data/catalog.json','w').write(json.dumps(cats,ensure_ascii=False,indent=2)+'\n')
print('descriptions',sum(bool(b.get('description')) for c in cats for b in c['blocks']))
