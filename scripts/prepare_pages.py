import json,re
from pathlib import Path
from bs4 import BeautifulSoup,Comment,NavigableString
from urllib.parse import urlparse

assets=json.loads(Path('reference/assets.json').read_text())
inventory=json.loads(Path('reference/inventory.json').read_text())
pages={}
aliases={}

def local(v):
 for u,p in sorted(assets.items(),key=lambda a:-len(a[0])):
  if isinstance(p,str):v=v.replace(u,p)
 return v

def attrs(e):
 a={}
 names={
   'class':'className',
   'for':'htmlFor',
   'tabindex':'tabIndex',
   'srcset':'srcSet',
   'crossorigin':'crossOrigin',
   'autoplay':'autoPlay',
   'playsinline':'playsInline',
   'viewbox':'viewBox',
   'preserveaspectratio':'preserveAspectRatio',
   'fill-rule':'fillRule',
   'clip-rule':'clipRule',
   'stroke-width':'strokeWidth',
   'stroke-linecap':'strokeLinecap',
   'stroke-linejoin':'strokeLinejoin',
   'aria-labelledby':'aria-labelledby',
   'itemprop':'itemProp',
   'itemtype':'itemType',
   'itemscope':'itemScope',
   'hreflang':'hrefLang',
   'datetime':'dateTime',
   'referrerpolicy':'referrerPolicy',
   'enable-background':'enableBackground',
   'xml:space':'xmlSpace',
   'xmlns:xlink':'xmlnsXlink',
   'itemid':'itemId'
 }
 for k,v in e.attrs.items():
  if k.startswith('on') or k in ['itemtype','itemscope','itemprop']:continue
  if isinstance(v,list):v=' '.join(v)
  v=local(v)
  if k=='href' and v.startswith('https://mat-aligner.com'):
   v=v.replace('https://mat-aligner.com','') or '/'
  if k=='style':
   style={}
   for d in v.split(';'):
    if ':' not in d:continue
    prop,val=d.split(':',1);prop=prop.strip();val=val.strip()
    if not prop or not val:continue
    prop=re.sub(r'-([a-z])',lambda m:m[1].upper(),prop) if not prop.startswith('--') else prop
    style[prop]=val
   v=style
  if k in ['controls','autoplay','loop','muted','playsinline','hidden','disabled']:v=True
  a[names.get(k,k)]=v
 return a

def node(e):
 if e is None:return None
 if isinstance(e,Comment):return None
 if isinstance(e,NavigableString):return str(e) if str(e).strip() else None
 if e.name in ['script','style','noscript']:return None
 return {'tag':e.name,'props':attrs(e),'children':[n for c in e.children if (n:=node(c)) is not None]}

for url,entry in inventory.items():
 if 'error' in entry:continue
 path=urlparse(url).path;canonical=urlparse(entry['url']).path
 if path!=canonical:aliases[path]=canonical;continue
 s=BeautifulSoup(Path('reference',entry['file']).read_text(),'html.parser')
 styles=[]
 for e in s.select('head link[rel=stylesheet],head style'):
  if e.name=='link':
   if e.get('href') in assets:styles.append({'href':assets[e['href']]})
  elif e.get('id') not in ['latepoint-main-front-inline-css','wp-emoji-styles-inline-css']:styles.append({'css':local(e.get_text())})
 for e in s.select('body > style'):styles.append({'css':local(e.get_text())})
 body=' '.join(c for c in s.body.get('class',[]) if not c.startswith(('latepoint','surerank','ehf-','elementor','wp-theme-')))
 pages[path]={
   'title':s.title.get_text() if s.title else '',
   'lang':s.html.get('lang','en-GB') if s.html else 'en-GB',
   'bodyClass':body,
   'styles':styles,
   'header':node(s.select_one('#masthead')),
   'content':node(s.select_one('#content')),
   'mobile':node(s.select_one('#ast-mobile-popup-wrapper')),
   'footer':node(s.select_one('#colophon')),
   'scrollTop':node(s.select_one('#ast-scroll-top')),
   'skip':node(s.select_one('.skip-link'))
 }

Path('src/pages.json').write_text(json.dumps(pages,ensure_ascii=False,separators=(',',':')))
Path('src/aliases.json').write_text(json.dumps(aliases,indent=2))
print('Prepared',len(pages),'React page trees;',len(aliases),'aliases')
