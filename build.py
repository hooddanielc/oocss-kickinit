# Custom builder for kick
# Just kickinit :-)

out = 'dist/'

from os import walk
from mod import Template

fKickjs = open('kick.js').read()
fKickHtml = open('index.html').read()

kickjs = Template(fKickjs)
kickjs = kickjs % {'kick': 'kick', 'ver': '0.1'}

kickhtml = Template(fKickHtml)
kickhtml = kickhtml % {'kick': 'kick', 'ver': '0.1'}

kickinit = open(out + 'kick.js', 'w+')
kickinit.write(kickjs)

kickinithtml = open(out + 'index.html', 'w+')
kickinithtml.write(kickhtml)