from PIL import Image, ImageDraw, ImageChops
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE = 'https://static.wixstatic.com/media/251da0_a2056558d8284210b4ed7477cb36a49f~mv2.png'
req = Request(SOURCE, headers={'User-Agent': 'Mozilla/5.0'})
with urlopen(req, timeout=30) as response:
    original = Image.open(BytesIO(response.read())).convert('RGBA')
original = original.resize((256, 256), Image.Resampling.LANCZOS)
mask = Image.new('L', (256, 256), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 255, 255), radius=62, fill=255)
original.putalpha(ImageChops.multiply(original.getchannel('A'), mask))
original.save('favicon.png')
original.resize((48, 48), Image.Resampling.LANCZOS).save('favicon-48.png')
print('SUPGO: favicon original con esquinas redondeadas generado.')
