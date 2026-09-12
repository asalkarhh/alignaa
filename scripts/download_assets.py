import requests,re,json,hashlib,concurrent.futures
from pathlib import Path
from urllib.parse import urljoin,urlparse,unquote
from bs4 import BeautifulSoup
root=Path('reference');out=Path('public/assets');out.mkdir(parents=True,exist_ok=True)
assets={};css_urls=set()
# Only public styles that affect the rendered Astra/Spectra pages. No plugin runtime or admin code.
css_ids=['astra-theme-css-css','astra-google-fonts-css','astra-menu-animation-css','wp-block-library-css','uagb-slick-css-css']
for f in root.glob('*.html'):
 s=BeautifulSoup(f.read_text(),'html.parser')
 for e in s.select('link[rel=stylesheet]'):
  if e.get('id') in css_ids or e.get('id','').startswith('uag-style-'):css_urls.add(e['href'])
 for e in s.select('img,video,source,a'):
  for a in ['src','poster','href']:
   v=e.get(a,'')
   if v.startswith('http') and (a!='href' or re.search(r'\.(pdf|mp4|png|jpe?g|webp)(?:\?|$)',v,re.I)):assets[v]=None
  for candidate in e.get('srcset','').split(','):
   if candidate.strip().startswith('http'):assets[candidate.strip().split()[0]]=None
 for e in s.select('style,[style]'):
  for v in re.findall(r'url\([\s\'"]*(.*?)[\s\'"]*\)',e.get('style','') if e.name!='style' else e.get_text()):
   if v.startswith('http'):assets[v]=None

def name(u):
 p=urlparse(u);base=unquote(p.path.rsplit('/',1)[-1]) or 'asset';base=re.sub('[^a-zA-Z0-9._-]','_',base)
 if p.netloc=='fonts.googleapis.com':base='google-fonts.css'
 return hashlib.sha256(u.encode()).hexdigest()[:10]+'-'+base
errors=[]
def fetch(u):
 path=out/name(u)
 try:
  if not path.exists():
   r=requests.get(u,timeout=60);r.raise_for_status();path.write_bytes(r.content)
  return u,'/assets/'+path.name
 except Exception as e:return u,{'error':str(e)}
for u,local in concurrent.futures.ThreadPoolExecutor(8).map(fetch,css_urls):
 assets[u]=local
 if isinstance(local,dict):errors.append({'url':u,**local});continue
 css=(Path('public')/local.lstrip('/')).read_text()
 for v in re.findall(r'url\([\s\'"]*(.*?)[\s\'"]*\)',css):
  if not v.startswith('data:'):assets[urljoin(u,v)]=None
pending=[u for u,v in assets.items() if v is None]
for u,local in concurrent.futures.ThreadPoolExecutor(8).map(fetch,pending):
 assets[u]=local
 if isinstance(local,dict):errors.append({'url':u,**local});print('FAIL',u,local,flush=True)
for u in css_urls:
 local=assets[u]
 if isinstance(local,str):
  path=Path('public')/local.lstrip('/');css=path.read_text()
  def repl(m):
   v=m.group(1).strip(' \"\'');a=assets.get(urljoin(u,v));return 'url("'+a+'")' if isinstance(a,str) else m.group(0)
  css=re.sub(r'url\((.*?)\)',repl,css);path.write_text(css)
(root/'assets.json').write_text(json.dumps(assets,indent=2))
(root/'css.json').write_text(json.dumps(sorted(css_urls),indent=2))
(root/'asset-errors.json').write_text(json.dumps(errors,indent=2))
print('Downloaded',len(assets),'assets;',len(errors),'errors',flush=True)
