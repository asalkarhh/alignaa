import requests,json,time
from bs4 import BeautifulSoup
from urllib.parse import urljoin,urlparse,urldefrag
from pathlib import Path
root=Path('reference');root.mkdir(exist_ok=True)
queue=['https://mat-aligner.com/'];seen={};fail=[]
s=requests.Session()
while queue:
 url=queue.pop(0)
 if url in seen:continue
 try:
  r=s.get(url,timeout=45);r.raise_for_status()
  if 'text/html' not in r.headers.get('Content-Type',''):continue
  soup=BeautifulSoup(r.text,'html.parser'); path=urlparse(url).path
  fn=('home' if path=='/' else path.strip('/').replace('/','__'))+'.html'
  (root/fn).write_text(r.text)
  links=[{'text':a.get_text(' ',strip=True),'url':urljoin(r.url,a['href'])} for a in soup.select('a[href]')]
  seen[url]={'url':r.url,'file':fn,'title':soup.title.get_text() if soup.title else '', 'links':links,'forms':[str(f) for f in soup.select('form')],'iframes':[str(f) for f in soup.select('iframe')]}
  for a in links:
   u=urldefrag(a['url'])[0];p=urlparse(u)
   if p.netloc=='mat-aligner.com' and not p.query and not any(p.path.lower().endswith(x) for x in ['.pdf','.jpg','.png','.webp','.mp4','.jpeg','.svg']) and u not in seen and u not in queue:queue.append(u)
  print(url,'=>',r.url,flush=True)
 except Exception as e:
  fail.append({'url':url,'error':str(e)});seen[url]={'error':str(e)};print('FAIL',url,str(e),flush=True)
(root/'inventory.json').write_text(json.dumps(seen,indent=2,ensure_ascii=False))
(root/'failures.json').write_text(json.dumps(fail,indent=2))
