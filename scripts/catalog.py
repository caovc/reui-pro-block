"""Read public category metadata only; never fetch paid source or preview assets."""
import json,re,urllib.request,concurrent.futures,pathlib
from html.parser import HTMLParser
class Links(HTMLParser):
 def __init__(self): super().__init__(); self.links=[]; self.cur=None
 def handle_starttag(self,t,a):
  if t=='a': self.cur=[dict(a).get('href',''),'']
 def handle_data(self,d):
  if self.cur:self.cur[1]+=d
 def handle_endtag(self,t):
  if t=='a' and self.cur:self.links.append(self.cur);self.cur=None
def read(url):
 for attempt in range(3):
  try:
   p=Links();p.feed(urllib.request.urlopen(url,timeout=45).read().decode());return p.links
  except Exception:
   if attempt==2:raise
base=read('https://reui.io/blocks')
paths=list(dict.fromkeys(h for h,t in base if re.fullmatch(r'/blocks/[^/]+/[^/.]+',h)))
names={h:t.strip() for h,t in base}
labels={'application':'Application','data-grid':'Data Grid','chart':'Charts','ai-agents':'AI & Agents','solutions':'Solutions','ecommerce':'eCommerce','marketing':'Marketing'}
def category(path):
 links=read('https://reui.io'+path); seen={}
 for h,t in links:
  if h.startswith(path+'/') and not h.endswith('.md'):
   seen.setdefault(h,t.strip())
 group,slug=path.split('/')[2:]
 title=slug.replace('-',' ').title().replace('Ai ','AI ').replace('Crm','CRM').replace('Cta','CTA').replace('Faq','FAQ')
 if slug=='drag-drop':title='Drag & Drop'
 blocks=[{'id':h.split('/')[-1],'name':t,'category':slug,'group':group,'reference':'https://reui.io'+h,'index':i} for i,(h,t) in enumerate(seen.items())]
 return {'id':slug,'name':title,'group':group,'groupLabel':labels[group],'reference':'https://reui.io'+path,'blocks':blocks,'count':len(blocks)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: cats=list(pool.map(category,paths))
pathlib.Path('src/data/catalog.json').write_text(json.dumps(cats,ensure_ascii=False,indent=2))
print('Categories',len(cats),'Blocks',sum(c['count'] for c in cats))
for g in labels: print(g,sum(c['count'] for c in cats if c['group']==g))
